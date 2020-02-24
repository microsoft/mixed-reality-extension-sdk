/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Connection, Payloads } from '../../internal';
// break import cycle
import { Protocol } from './protocol';
import { ServerPreprocessing } from './serverPreprocessing';

/**
 * @hidden
 * Class to manage the join process with a client.
 */
export class Sync extends Protocol {
	constructor(conn: Connection) {
		super(conn);
		// Behave like a server-side endpoint (send heartbeats, measure connection quality)
		this.use(new ServerPreprocessing());
	}

	/** @override */
	public startListening() {
		super.sendPayload({ type: 'sync-complete' } as Payloads.SyncComplete);
		process.nextTick(() => { this.resolve(); });
	}
}
