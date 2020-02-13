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
	NetworkStatsTracker,
	QueuedPromise
} from '../../internal';

/**
 * @hidden
 */
export class EventedConnection extends EventEmitter implements Connection {
	protected _quality = new ConnectionQuality();
	private _promises = new Map<Guid, QueuedPromise>();
	public statsTracker = new NetworkStatsTracker();

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

	/**
	 * @hidden
	 * Replace this connection's quality tracker
	 */
	public linkConnectionQuality(quality: ConnectionQuality) {
		this._quality = quality;
		this.emit('linkQuality', quality);
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
		/* eslint-disable @typescript-eslint/no-use-before-define */
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
		/* eslint-enable @typescript-eslint/no-use-before-define */
	}
}
