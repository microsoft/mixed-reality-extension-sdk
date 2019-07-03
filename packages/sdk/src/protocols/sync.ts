/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerPreprocessing } from '.';
import { Connection } from '..';
import * as Payloads from '../types/network/payloads';
import { Protocol } from './protocol';

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
