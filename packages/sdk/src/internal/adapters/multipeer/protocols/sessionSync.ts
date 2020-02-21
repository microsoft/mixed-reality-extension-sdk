/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Payloads, Session } from '../../../../internal';
// break import cycle
import { Protocol, ClientPreprocessing } from '../../../protocols';

/**
 * @hidden
 * Class to manage the synchronization phase when connecting to the app. There should be no state to synchronize
 */
export class SessionSync extends Protocol {
	constructor(session: Session) {
		super(session.conn);
		// Behave like a client-side endpoint (record latency, respond to heartbeats).
		this.use(new ClientPreprocessing(this));
	}

	/** @override */
	public startListening() {
		super.startListening();
		this.sendPayload({ type: 'sync-request' } as Payloads.SyncRequest);
	}

	/** @private */
	public 'recv-sync-complete' = (payload: Payloads.SyncComplete) => {
		this.resolve();
	};
}
