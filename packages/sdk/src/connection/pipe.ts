/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Connection, EventedConnection } from '.';
import { Message } from '..';

/**
 * @hidden
 * Class representing two connected endpoints, allowing them to send and receive to and from one another
 */
export class Pipe {
	// tslint:disable:variable-name
	private _local: EventedConnection;
	private _remote: EventedConnection;
	// tslint:enable:variable-name

	public get local(): Connection { return this._local; }
	public get remote(): Connection { return this._remote; }

	constructor() {
		this._local = new EventedConnection();
		this._remote = new EventedConnection();
		this.onLocalClose = this.onLocalClose.bind(this);
		this.onRemoteClose = this.onRemoteClose.bind(this);
		this._local.on('send', (message: Message) => {
			process.nextTick(() => {
				this._remote.recv({ ...message });
			});
		});
		this._remote.on('send', (message: Message) => {
			process.nextTick(() => {
				this._local.recv({ ...message });
			});
		});
		this._local.on('close', this.onLocalClose);
		this._remote.on('close', this.onRemoteClose);

		this._local.statsTracker.on('incoming', bytes => this._remote.statsTracker.recordIncoming(bytes));
		this._local.statsTracker.on('outgoing', bytes => this._remote.statsTracker.recordOutgoing(bytes));
	}

	private onLocalClose() {
		this._local.off('close', this.onLocalClose);
		process.nextTick(() => {
			this._remote.close();
		});
	}

	private onRemoteClose() {
		this._remote.off('close', this.onRemoteClose);
		process.nextTick(() => {
			this._local.close();
		});
	}
}
