/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as WS from 'ws';

import { log } from '../..';
import { filterEmpty, Message, validateJsonFieldName } from '../../internal';
// break import cycle
import { EventedConnection } from './eventedConnection';

/**
 * An implementation of the Connection interface that wraps a WebSocket.
 */
export class WebSocket extends EventedConnection {
	public get remoteAddress() { return this._remoteAddress; }

	constructor(private _ws: WS, private _remoteAddress: string) {
		super();

		this._ws.on('close', () => {
			super.close();
		});

		this._ws.on('message', (json: WS.Data) => {
			this.statsTracker.recordIncoming(Buffer.byteLength(json as string));

			let message: Message = null;
			try {
				message = JSON.parse(json as string);
			} catch (e) {
				log.error('network', e);
			}
			if (message) {
				// Uncomment to introduce latency on incoming messages.
				// NOTE: This will sometimes change message ordering.
				//setTimeout(() => {
				try {
					super.recv(message);
				} catch (e) {
					log.error('network', e);
				}
				//}, 200 + 50 * Math.random());
			}
		});

		super.on('send', (message: Message) => {
			const json = JSON.stringify(
				message, (key, value) => {
					validateJsonFieldName(key);
					return filterEmpty(value);
				});
			this.statsTracker.recordOutgoing(Buffer.byteLength(json));

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
