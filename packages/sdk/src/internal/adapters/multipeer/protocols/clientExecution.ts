/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Client,
	ClientDesyncPreprocessor,
	ExportedPromise,
	Message,
	MissingRule,
	Rules
} from '../../..';
// break import cycle
import { Heartbeat, Middleware, Protocol, ServerPreprocessing } from '../../../protocols';

/**
 * @hidden
 * Class for routing messages between the client and the session
 */
export class ClientExecution extends Protocol implements Middleware {
	private heartbeat: Heartbeat;
	private heartbeatTimer: NodeJS.Timer;

	/** @override */
	public get name(): string { return `${this.constructor.name} client ${this.client.id.substr(0, 8)}`; }

	constructor(private client: Client) {
		super(client.conn);
		this.heartbeat = new Heartbeat(this);
		this.beforeRecv = this.beforeRecv.bind(this);
		// Behave like a server-side endpoint (send heartbeats, measure connection quality)
		this.use(new ServerPreprocessing());
		// Filter user-exclusive actors
		this.use(new ClientDesyncPreprocessor(client));
		// Use middleware to pipe client messages to the session.
		this.use(this);
	}

	/** @override */
	public sendMessage(message: Message, promise?: ExportedPromise, timeoutSeconds?: number) {
		// Apply timeout to messages going to the client.
		const rule = Rules[message.payload.type] || MissingRule;
		super.sendMessage(message, promise, rule.client.timeoutSeconds);
	}

	public startListening() {
		super.startListening();
		if (!this.heartbeatTimer) {
			// Periodically measure connection latency.
			this.heartbeatTimer = this.setHeartbeatTimer();
		}
	}

	public stopListening() {
		clearTimeout(this.heartbeatTimer);
		this.heartbeatTimer = undefined;
		super.stopListening();
	}

	private setHeartbeatTimer(): NodeJS.Timer {
		return setTimeout(async () => {
			if (this.heartbeatTimer) {
				try {
					await this.heartbeat.send();
					this.heartbeatTimer = this.setHeartbeatTimer();
				} catch {
					this.client.leave();
					this.resolve();
				}
			}
			// Irregular heartbeats are a good thing in this instance.
		}, 1000 * (5 + 5 * Math.random()));
	}

	public beforeRecv = (message: Message): Message => {
		if (this.promises.has(message.replyToId)) {
			// If we have a queued promise for this message, let it through
			return message;
		} else {
			// Notify listeners we received a message.
			this.emit('recv', message);
			// Cancel the message
			return undefined;
		}
	};
}
