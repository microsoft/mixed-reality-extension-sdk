/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';
import { Connection, ConnectionQuality } from '.';
import { Message } from '..';

/**
 * @hidden
 * A Connection that does performs nops for send and receive.
 */
export class NullConnection extends EventEmitter implements Connection {
	// tslint:disable:variable-name
	private _quality = new ConnectionQuality();
	// tslint:enable:variable-name

	/** @inheritdoc */
	public get quality() { return this._quality; }

	/** @inheritdoc */
	public get promises() { return {}; }

	// Bug in Node: EventEmitter doesn't alias this method
	/** @inheritdoc */
	public off(event: string | symbol, listener: (...args: any[]) => void): this {
		return this.removeListener(event, listener);
	}

	/** @inheritdoc */
	public close(): void {
	}

	/** @inheritdoc */
	public send(message: Message): void {
	}

	/** @inheritdoc */
	public recv(message: Message): void {
	}
}
