/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Session } from '..';
import * as Protocols from '../../../protocols';
import * as Payloads from '../../../types/network/payloads';

/**
 * @hidden
 * Protocol for handling handshake with the app instance (Session is a client of App)
 */
export class SessionHandshake extends Protocols.Protocol {
	constructor(session: Session) {
		super(session.conn);
		// Behave like a client-side endpoint (record latency, respond to heartbeats).
		this.use(new Protocols.ClientPreprocessing(this));
	}

	/** @override */
	public startListening() {
		super.startListening();
		this.sendPayload({ type: 'handshake' } as Payloads.Handshake);
	}

	/** @private */
	public 'recv-handshake-reply' = (payload: Payloads.HandshakeReply) => {
		this.sendPayload({ type: 'handshake-complete' } as Payloads.HandshakeComplete);
		this.resolve();
	};
}
