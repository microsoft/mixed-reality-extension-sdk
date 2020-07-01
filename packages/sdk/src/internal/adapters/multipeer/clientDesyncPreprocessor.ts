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
} from '../../../internal';

/**
 * Filter user-exclusive actors to a queue, then flush them after user-join
 * @hidden
 */
export class ClientDesyncPreprocessor implements Protocols.Middleware {
	constructor(private client: Client) { }
	/** @hidden */
	public beforeSend(message: Message, promise?: ExportedPromise): Message {
		const payloadType = message.payload.type;
		const rule = Rules[payloadType] || MissingRule;
		const forUser = rule.client.shouldSendToUser(
			message, this.client.userId, this.client.session, this.client);
		if (forUser !== null && !this.client.userId) {
			// this message is user-exclusive, and the client's user ID is not yet settled,
			// queue and cancel send for now
			this.client.userExclusiveMessages.push({ message, promise });
		} else if (forUser === null || forUser === true && !!this.client.userId) {
			// this message is intended for this client's user, send now
			return message;
		}
		// this message is intended for a different user, discard
	}

	/** @hidden */
	public beforeRecv(message: Message): Message {
		if (message.payload.type === 'user-joined') {
			const userJoin = message.payload as Payloads.UserJoined;
			this.client.userId = userJoin.user.id;

			// emit signal now since authoritative client user was unknown when client was declared autritative
			if (this.client.authoritative) {
				this.client.session.emit('set-authoritative', this.client.userId);
			}

			while (this.client.userExclusiveMessages.length > 0) {
				const queuedMsg = this.client.userExclusiveMessages.splice(0, 1)[0];
				const rule = Rules[queuedMsg.message.payload.type] || MissingRule;
				const forUser = rule.client.shouldSendToUser(
					queuedMsg.message, this.client.userId, this.client.session, this.client);
				if (forUser) {
					this.client.send(queuedMsg.message, queuedMsg.promise);
				}
			}
		}
		return message;
	}
}
