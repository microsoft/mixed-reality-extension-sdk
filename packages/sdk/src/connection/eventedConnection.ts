/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';
import { Connection, ConnectionQuality } from '.';
import { Message } from '..';
import { QueuedPromise } from '../utils/queuedPromise';
import { NetworkStatsReport, NetworkStatsTracker } from './networkStats';

/**
 * @hidden
 */
export class EventedConnection extends EventEmitter implements Connection {
	// tslint:disable:variable-name
	private _quality = new ConnectionQuality();
	private _promises: { [id: string]: QueuedPromise } = {};
	public statsTracker = new NetworkStatsTracker();
	// tslint:enable:variable-name

	private queuedMessages: Message[] = [];
	private timeout: NodeJS.Timer;

	/** @inheritdoc */
	public get quality() { return this._quality; }

	/** @inheritdoc */
	public get promises() { return this._promises; }

	/** @inheritdoc */
	public get statsReport(): NetworkStatsReport {
		return this.statsTracker.reportStats();
	}

	// Bug in Node: EventEmitter doesn't alias this method
	/** @inheritdoc */
	public off(event: string | symbol, listener: (...args: any[]) => void): this {
		return this.removeListener(event, listener);
	}

	/** @inheritdoc */
	public close(): void {
		this.emit('close');
	}

	/** @inheritdoc */
	public send(message: Message): void {
		this.emit('send', message);
	}

	/** @inheritdoc */
	public recv(message: Message): void {
		const hasListeners = () => !!this.listeners('recv').length;
		const checkAndLoop = () => {
			this.timeout = undefined;
			if (hasListeners()) {
				dispatchQueuedMessages();
			} else {
				setRetryLoop();
			}
		};
		const dispatchQueuedMessages = () => {
			for (const queuedMessage of this.queuedMessages.splice(0)) {
				this.emit('recv', queuedMessage);
			}
		};
		const setRetryLoop = () => this.timeout = this.timeout || setTimeout(checkAndLoop, 100);

		if (hasListeners()) {
			this.emit('recv', message);
		} else {
			this.queuedMessages.push(message);
			setRetryLoop();
		}
	}
}
