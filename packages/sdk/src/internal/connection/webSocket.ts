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
			if (json instanceof Buffer) {
				this.statsTracker.recordIncoming(json.byteLength);
				json = json.toString('utf8')
			} else {
				json = json as string;
				this.statsTracker.recordIncoming(Buffer.byteLength(json));
			}

			let message: Message = null;
			try {
				message = JSON.parse(json);
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

		super.on('send', (message: Message, serializedMessage?: Buffer) => {
			if (!serializedMessage) {
				serializedMessage = Buffer.from(
					JSON.stringify(message, (key, value) => {
						validateJsonFieldName(key);
						return filterEmpty(value);
					}), 'utf8');
			}
			this.statsTracker.recordOutgoing(serializedMessage.byteLength);

			// Uncomment to introduce latency on outgoing messages.
			// NOTE: This will sometimes change message ordering.
			// setTimeout(() => {
			try {
				this._ws.send(serializedMessage, { binary: false, compress: false });
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
