/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Guid } from '../..';
import { Payload } from './payloads';

/**
 * @hidden
 * A message sent over the network.
 */
export type Message<PayloadT = Payload> = {
	/**
	 * Unique id of this message. When sending, a new id will be assigned if not already so.
	 */
	id?: Guid;

	/**
	 * (Optional) If the client is replying to us, this is the id of the original message.
	 */
	replyToId?: Guid;

	/**
	 * (Server to client) The time the server sent this message. In milliseconds.
	 */
	serverTimeMs?: number;

	/**
	 * (Server to client) The estimated latency on the connection. In milliseconds.
	 */
	latencyEstimateMs?: number;

	/**
	 * The message payload.
	 */
	payload: Partial<PayloadT>;
};
