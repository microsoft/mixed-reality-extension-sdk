/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';

import { Guid } from '../..';
import {
	Connection,
	ConnectionQuality,
	Message,
	NetworkStatsReport,
	QueuedPromise
} from '../../internal';

/**
 * @hidden
 * A Connection that does performs nops for send and receive.
 */
export class NullConnection extends EventEmitter implements Connection {
	private _quality = new ConnectionQuality();

	/** @inheritdoc */
	public get quality() { return this._quality; }

	/** @inheritdoc */
	public get promises(): Map<Guid, QueuedPromise> { return null; }

	/** @inheritdoc */
	public get statsReport(): NetworkStatsReport {
		// null connections do not send or receive traffic
		return {
			networkBandwidthIn: [0, 0, 0] as [number, number, number],
			networkBandwidthOut: [0, 0, 0] as [number, number, number],
			networkMessageCount: [0, 0, 0] as [number, number, number]
		};
	}

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
