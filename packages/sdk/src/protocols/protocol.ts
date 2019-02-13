/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';
import UUID from 'uuid/v4';
import { Connection, Message } from '..';
import { log } from '../log';
import { Payload } from '../types/network/payloads';
import { ExportedPromise } from '../utils/exportedPromise';
import filterEmpty from '../utils/filterEmpty';
import { Middleware } from './middleware';

// tslint:disable:variable-name
/**
 * The amount of time to wait for a reply message before closing the connection.
 * Set to zero to disable timeouts.
 */
export let DefaultConnectionTimeoutSeconds = 30;
// tslint:enable:variable-name

/**
 * @hidden
 * Class to handle sending and receiving messages with a client.
 */
export class Protocol extends EventEmitter {
    private middlewares: Middleware[] = [];
    // tslint:disable-next-line:variable-name
    private _timeoutSeconds = DefaultConnectionTimeoutSeconds;

    private promise: Promise<void>;
    private promiseResolve: (value?: void | PromiseLike<void>) => void;
    private promiseReject: (reason?: any) => void;

    public get conn() { return this._conn; }
    public get promises() { return this.conn.promises; }
    public get name() { return this.constructor.name; }

    public get timeoutSeconds() { return this._timeoutSeconds; }
    public set timeoutSeconds(value) { this._timeoutSeconds = value; }

    // tslint:disable-next-line:variable-name
    constructor(private _conn: Connection) {
        super();
        this.onReceive = this.onReceive.bind(this);
        this.onClose = this.onClose.bind(this);
        this.promise = new Promise<void>((resolve, reject) => {
            this.promiseResolve = resolve;
            this.promiseReject = reject;
        });
    }

    public async run() {
        try {
            this.startListening();
            await this.completed();
        } catch (e) {
            this.reject(e);
        }
    }

    public async completed() {
        return this.promise;
    }

    public use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    public startListening() {
        log.debug('network', `${this.name} started listening`);
        this.conn.on('recv', this.onReceive);
        this.conn.on('close', this.onClose);
    }

    public stopListening() {
        this.conn.off('recv', this.onReceive);
        this.conn.off('close', this.onClose);
        log.debug('network', `${this.name} stopped listening`);
    }

    public sendPayload(payload: Partial<Payload>, promise?: ExportedPromise) {
        this.sendMessage({ payload }, promise);
    }

    public sendMessage(message: Message, promise?: ExportedPromise) {
        message.id = message.id || UUID();

        // Run message through all the middlewares
        const middlewares = this.middlewares.slice();
        for (const middleware of middlewares) {
            if (middleware.beforeSend) {
                message = middleware.beforeSend(message, promise);
                if (!message) {
                    if (promise && promise.reject) {
                        promise.reject();
                    }
                    return;
                }
            }
        }

        const setReplyTimeout = () => {
            if (this.timeoutSeconds > 0) {
                return setTimeout(() => {
                    // tslint:disable-next-line:max-line-length
                    this.rejectPromiseForMessage(message.id, `Timed out awaiting response for ${message.payload.type}, id:${message.id}.`);
                    this.conn.close();
                }, this.timeoutSeconds * 1000);
            }
        };

        // Save the reply callback
        if (promise) {
            this.promises[message.id] = {
                promise,
                timeout: setReplyTimeout()
            };
        }

        log.verbose('network', `${this.name} send id:${message.id.substr(0, 8)}, type:${message.payload.type}`);
        log.verbose('network-content', JSON.stringify(message, (key, value) => filterEmpty(value)));

        // Let the multipeer adapter know the SDK is awaiting a response to this message, so that it can in turn
        // wait for all peer responses before forwarding the client's response back to the app. This is needed so
        // that the app knows the operation completed on all peers before proceeding.
        if (promise) {
            message.awaitingResponse = true;
        }

        this.conn.send(message);
    }

    public recvMessage(message: Message) {
        if (message.replyToId) {
            // tslint:disable-next-line:max-line-length
            log.verbose('network', `${this.name} recv id:${message.id.substr(0, 8)}, replyTo:${message.replyToId.substr(0, 8)}, type:${message.payload.type}`);
        } else {
            // tslint:disable-next-line:max-line-length
            log.verbose('network', `${this.name} recv id:${message.id.substr(0, 8)}, type:${message.payload.type}`);
        }
        log.verbose('network-content', JSON.stringify(message, (key, value) => filterEmpty(value)));

        // Run message through all the middlewares
        const middlewares = this.middlewares.slice();
        for (const middleware of middlewares) {
            if (middleware.beforeRecv) {
                message = middleware.beforeRecv(message);
                if (!message) {
                    return;
                }
            }
        }

        if (message.replyToId) {
            this.handleReplyMessage(message);
        } else {
            this.recvPayload(message.payload);
        }
    }

    public recvPayload(payload: Partial<Payload>) {
        if (payload && payload.type && payload.type.length) {
            const handler = (this as any)[`recv-${payload.type}`] || (() => {
                // tslint:disable-next-line:no-console
                console.error(`[ERROR] ${this.name} has no handler for payload ${payload.type}!`);
            });
            handler(payload);
        } else {
            // tslint:disable-next-line:no-console
            console.error(`[ERROR] ${this.name} invalid message payload!`);
        }
    }

    public drainPromises() {
        if (Object.keys(this.promises).length) {
            return new Promise<void>((resolve, reject) => {
                const check = (): NodeJS.Timeout | void => Object.keys(this.promises).length ? set() : resolve();
                const set = () => setTimeout(() => check(), 10);
                set();
                // TODO: Would be better to not have to check on a timer here
            });
        }
    }

    protected resolve() {
        this.stopListening();
        this.promiseResolve();
    }

    protected reject(e?: any) {
        this.stopListening();
        this.promiseReject(e);
    }

    protected handleReplyMessage(message: Message) {
        const queuedPromise = this.promises[message.replyToId];
        if (!queuedPromise) {
            // tslint:disable-next-line:no-console max-line-length
            console.error(`[ERROR] ${this.name} received unexpected reply message! payload: ${message.payload.type}, replyToId: ${message.replyToId}`);
        } else {
            delete this.promises[message.replyToId];
            clearTimeout(queuedPromise.timeout);
            queuedPromise.promise.resolve(message.payload, message);
        }
    }

    private rejectPromiseForMessage(messageId: string, reason?: any) {
        const queuedPromise = this.promises[messageId];
        if (queuedPromise && queuedPromise.promise && queuedPromise.promise.reject) {
            try { clearTimeout(queuedPromise.timeout); } catch { }
            try { delete this.promises[messageId]; } catch { }
            try { queuedPromise.promise.reject(reason); } catch { }
        }
    }

    private onReceive = (message: Message) => {
        this.recvMessage(message);
    }

    private onClose = () => {
        Object.keys(this.promises).map(key => {
            this.rejectPromiseForMessage(key, "Connection closed.");
        });
    }
}
