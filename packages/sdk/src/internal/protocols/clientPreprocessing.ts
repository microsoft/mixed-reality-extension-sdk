/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message, Payloads, Protocols } from '../../internal';

/**
 * @hidden
 */
export class ClientPreprocessing implements Protocols.Middleware {
	constructor(private protocol: Protocols.Protocol) {
		this.beforeRecv = this.beforeRecv.bind(this);
	}

	/** @private */
	public beforeRecv = (message: Message): Message => {
		if (message.serverTimeMs > 0) {
			this.protocol.conn.quality.trackingClock.update(message.serverTimeMs);
		}
		if (message.latencyEstimateMs > 0) {
			this.protocol.conn.quality.latencyMs.update(message.latencyEstimateMs);
		}
		if (message.payload.type === 'heartbeat') {
			this.protocol.sendMessage({
				replyToId: message.id,
				payload: {
					type: 'heartbeat-reply',
				} as Payloads.HeartbeatReply,
			});
			message = undefined;
		}
		return message;
	};
}
