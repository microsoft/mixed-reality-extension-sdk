/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Connection, Payloads, Protocols } from '../../internal';

/**
 * @hidden
 * Class to manage the join process with a client.
 */
export class Sync extends Protocols.Protocol {
	constructor(conn: Connection) {
		super(conn);
		// Behave like a server-side endpoint (send heartbeats, measure connection quality)
		this.use(new Protocols.ServerPreprocessing());
	}

	/** @override */
	public startListening() {
		super.sendPayload({ type: 'sync-complete' } as Payloads.SyncComplete);
		process.nextTick(() => { this.resolve(); });
	}
}
