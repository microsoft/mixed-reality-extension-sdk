/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Middleware, Protocol } from '.';
import { Message } from '..';
import { HeartbeatReply } from '../types/network/payloads';

/**
 * @hidden
 */
export class ClientPreprocessing implements Middleware {
	constructor(private protocol: Protocol) {
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
				} as HeartbeatReply,
			});
			message = undefined;
		}
		return message;
	};
}
