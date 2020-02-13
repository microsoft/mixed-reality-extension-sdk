/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Client,
	ExportedPromise,
	Message,
	MissingRule,
	Payloads,
	Protocols,
	Rules
} from '../../..';

export class ClientStartup extends Protocols.Protocol {
	/** @override */
	public get name(): string { return `${this.constructor.name} client ${this.client.id.substr(0, 8)}`; }

	constructor(private client: Client, syncRequest: Payloads.SyncRequest) {
		super(client.conn);
		// Behave like a server-side endpoint (send heartbeats, measure connection quality).
		this.use(new Protocols.ServerPreprocessing());
		// If we've already received the 'sync-request' payload, process it now.
		if (syncRequest) {
			setImmediate(async () => {
				await this.performStartup(syncRequest);
			});
		}
	}

	/** @override */
	public sendMessage(message: Message, promise?: ExportedPromise, timeoutSeconds?: number) {
		// Apply timeout to messages going to the client.
		const rule = Rules[message.payload.type] || MissingRule;
		super.sendMessage(message, promise, rule.client.timeoutSeconds);
	}

	/**
	 * @hidden
	 */
	public 'recv-sync-request' = async (payload: Payloads.SyncRequest) => {
		await this.performStartup(payload);
	};

	private async performStartup(payload: Payloads.SyncRequest) {
		// Do a quick measurement of connection latency.
		const heartbeat = new Protocols.Heartbeat(this);
		await heartbeat.runIterations(10); // Allow exceptions to propagate out.
		this.resolve();
	}
}
