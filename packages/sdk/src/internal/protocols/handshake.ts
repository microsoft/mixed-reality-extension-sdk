/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Connection, OperatingModel, Payloads } from '../../internal';
// break import cycle
import { Protocol } from './protocol';
import { ServerPreprocessing } from './serverPreprocessing';

/**
 * @hidden
 * Class to manage the handshake process with a client.
 */
export class Handshake extends Protocol {
	public syncRequest: Payloads.SyncRequest;

	constructor(conn: Connection, private sessionId: string, private operatingModel: OperatingModel) {
		super(conn);
		// Behave like a server-side endpoint (send heartbeats, measure connection quality)
		this.use(new ServerPreprocessing());
	}

	/** @private */
	public 'recv-handshake' = (payload: Payloads.Handshake) => {
		this.sendPayload({
			type: 'handshake-reply',
			sessionId: this.sessionId,
			operatingModel: this.operatingModel,
		} as Payloads.HandshakeReply);
	};

	/** @private */
	public 'recv-handshake-complete' = (payload: Payloads.HandshakeComplete) => {
		this.resolve();
	};

	/** @private */
	public 'recv-sync-request' = (payload: Payloads.SyncRequest) => {
		// The way the protocol works right now, this message can be sent unexpectedly early by the client.
		// If we receive it, we'll cache it and pass it along to the next protocol.
		this.syncRequest = payload;
	};
}
