/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Client,
	ExportedPromise,
	Message,
	MissingRule,
	OperatingModel,
	Rules
} from '../../..';
// break import cycle
import { Handshake } from '../../../protocols';

/**
 * @hidden
 */
export class ClientHandshake extends Handshake {
	/** @override */
	public get name(): string { return `${this.constructor.name} client ${this.client.id.substr(0, 8)}`; }

	constructor(private client: Client, sessionId: string) {
		super(client.conn, sessionId, OperatingModel.PeerAuthoritative);
	}

	/** @override */
	public sendMessage(message: Message, promise?: ExportedPromise, timeoutSeconds?: number) {
		// Apply timeout to messages going to the client.
		const rule = Rules[message.payload.type] || MissingRule;
		super.sendMessage(message, promise, rule.client.timeoutSeconds);
	}
}
