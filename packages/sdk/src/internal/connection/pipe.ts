/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventedConnection, Message } from '../../internal';

/**
 * @hidden
 * Class representing two connected endpoints, allowing them to send and receive to and from one another
 */
export class Pipe {
	private _local: EventedConnection;
	private _remote: EventedConnection;
	private _onLocalClose: () => void;
	private _onRemoteClose: () => void;

	public get local() { return this._local; }
	public get remote() { return this._remote; }

	constructor() {
		this._local = new EventedConnection();
		this._remote = new EventedConnection();
		this._onLocalClose = this.onLocalClose.bind(this);
		this._onRemoteClose = this.onRemoteClose.bind(this);
		this._local.on('send', (message: Message) => {
			process.nextTick(() => {
				this._remote.recv(message);
			});
		});
		this._remote.on('send', (message: Message) => {
			process.nextTick(() => {
				this._local.recv(message);
			});
		});
		this._local.on('close', this._onLocalClose);
		this._remote.on('close', this._onRemoteClose);
	}

	private onLocalClose() {
		this._local.off('close', this._onLocalClose);
		process.nextTick(() => {
			this._remote.close();
		});
	}

	private onRemoteClose() {
		this._remote.off('close', this._onRemoteClose);
		process.nextTick(() => {
			this._local.close();
		});
	}
}
