/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as WS from 'ws';
import { EventedConnection } from '.';
import { Message } from '..';
import filterEmpty from '../utils/filterEmpty';
import validateJsonFieldName from '../utils/validateJsonFieldName';
import { log } from './../log';

/**
 * An implementation of the Connection interface that wraps a WebSocket.
 */
export class WebSocket extends EventedConnection {

    public get remoteAddress() { return this._remoteAddress; }

    // tslint:disable-next-line:variable-name
    constructor(private _ws: WS, private _remoteAddress: string) {
        super();

        this._ws.on('close', () => {
            super.close();
        });

        this._ws.on('message', (json: WS.Data) => {
            let message: Message = null;
            try {
                message = JSON.parse(json as string);
            } catch (e) {
                log.error('network', e);
            }
            if (message) {
                // Uncomment to introduce latency on incoming messages.
                // NOTE: This will sometimes change message ordering.
                // setTimeout(() => {
                try {
                    super.recv(message);
                } catch (e) {
                    log.error('network', e);
                }
                // }, 250 * Math.random());
            }
        });

        super.on('send', (message: Message) => {
            const json = JSON.stringify(
                message, (key, value) => {
                    validateJsonFieldName(key);
                    return filterEmpty(value);
                });
            // Uncomment to introduce latency on outgoing messages.
            // NOTE: This will sometimes change message ordering.
            // setTimeout(() => {
            try {
                this._ws.send(json);
            } catch (e) {
                log.error('network', e);
            }
            // }, 1000 * Math.random());
        });
    }

    /** @override */
    public close(): void {
        try {
            this._ws.close();
        } catch (e) { }
    }
}
