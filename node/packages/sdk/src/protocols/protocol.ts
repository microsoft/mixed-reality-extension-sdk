/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';
import UUID from 'uuid/v4';
import { Message, Services } from '..';
import { Payload } from '../types/network/payloads';
import { ExportedPromise } from '../utils/exportedPromise';
import { Middleware } from './middleware';

/**
 * @hidden
 * Class to handle sending and receiving messages with a client.
 */
export class Protocol extends EventEmitter {
    private middlewares: Middleware[] = [];

    public get conn() { return this.services.conn; }
    public get logger() { return this.services.logger; }
    public get services() { return this._services; }
    public get promises() { return this.conn.promises; }
    public get name(): string { return this.constructor.name; }

    // tslint:disable-next-line:variable-name
    constructor(private _services: Services) {
        super();
        this.onReceive = this.onReceive.bind(this);
    }

    public use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    public startListening() {
        this.conn.on('recv', this.onReceive);
    }

    public stopListening() {
        this.conn.off('recv', this.onReceive);
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

        // Save the reply callback
        if (promise) {
            this.promises[message.id] = {
                promise,
                timestamp: Date.now(),
            };
        }

        this.logger.log('debug', `${this.name} send`, JSON.stringify(message));
        this.conn.send(message);
    }

    public recvMessage(message: Message) {
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

        this.logger.log('debug', `${this.name} recv`, JSON.stringify(message));
        if (message.replyToId) {
            this.handleReplyMessage(message);
        } else {
            this.recvPayload(message.payload);
        }
    }

    public recvPayload(payload: Partial<Payload>) {
        if (payload && payload.type && payload.type.length) {
            // tslint:disable-next-line:no-any
            const handler = (this as any)[`recv-${payload.type}`] || (() => {
                this.logger.log('error', `${this.name} has no handler for payload ${payload.type}!`);
            });
            handler(payload);
        } else {
            this.logger.log('error', `${this.name} invalid message payload!`);
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

    protected handleReplyMessage(message: Message) {
        const queuedPromise = this.promises[message.replyToId];
        if (!queuedPromise) {
            this.logger.log('error', `${this.name} received unexpected reply message! replyToId: ${message.replyToId}`);
        } else {
            delete this.promises[message.replyToId];
            queuedPromise.promise.resolve(message.payload, message);
        }
    }

    private onReceive = (message: Message) => {
        this.recvMessage(message);
    }
}
