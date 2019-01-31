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
export let ConnectionTimeoutSeconds = 30;
// tslint:enable:variable-name

/**
 * @hidden
 * Class to handle sending and receiving messages with a client.
 */
export class Protocol extends EventEmitter {
    private middlewares: Middleware[] = [];

    private promise: Promise<void>;
    private promiseResolve: (value?: void | PromiseLike<void>) => void;
    private promiseReject: (reason?: any) => void;

    public get conn() { return this._conn; }
    public get promises() { return this.conn.promises; }
    public get name() { return this.constructor.name; }

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
        log.verbose('network', `${this.name} started listening`);
        this.conn.on('recv', this.onReceive);
        this.conn.on('close', this.onClose);
    }

    public stopListening() {
        this.conn.off('recv', this.onReceive);
        this.conn.off('close', this.onClose);
        log.verbose('network', `${this.name} stopped listening`);
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
            if (ConnectionTimeoutSeconds > 0) {
                return setTimeout(() => {
                    // TODO: Eventually convert this to a log.info('network', ...) call.
                    // tslint:disable-next-line:no-console
                    console.info(`[INFO] Timeout on message ${message.payload.type}, id:${message.id}.`);
                    this.rejectPromiseForMessage(message.id);
                    this.conn.close();
                }, ConnectionTimeoutSeconds * 1000);
            }
        };

        // Save the reply callback
        if (promise) {
            this.promises[message.id] = {
                promise,
                timeout: setReplyTimeout()
            };
        }

        log.verbose('network', `${this.name} send`,
            JSON.stringify(message, (key, value) => filterEmpty(value)));

        this.conn.send(message);
    }

    public recvMessage(message: Message) {
        log.verbose('network', `${this.name} recv`,
            JSON.stringify(message, (key, value) => filterEmpty(value)));

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
            // tslint:disable-next-line:no-console
            console.error(`[ERROR] ${this.name} received unexpected reply message! replyToId: ${message.replyToId}`);
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
            try { queuedPromise.promise.reject(reason); } catch { }
            try { delete this.promises[messageId]; } catch { }
        }
    }

    private onReceive = (message: Message) => {
        this.recvMessage(message);
    }

    private onClose = () => {
        Object.keys(this.promises).map(key => {
            this.rejectPromiseForMessage(key);
        });
    }
}
