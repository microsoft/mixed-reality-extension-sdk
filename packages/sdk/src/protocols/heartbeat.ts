/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Protocol } from '.';
import * as Payloads from '../types/network/payloads';

const MS_PER_S = 1e3;
const MS_PER_NS = 1e-6;
/**
 * @hidden
 * Periodically measures performance characteristics of the connection (latency).
 */
export class Heartbeat {
	/**
	 * Creates a new Heartbeat instance.
	 * @param protocol The parent protocol object.
	 */
	constructor(private protocol: Protocol) {
	}

	/**
	 * Polls connection quality the specified number of times.
	 */
	public async runIterations(sampleCount: number) {
		for (let i = 0; i < sampleCount; ++i) {
			await this.send(); // Allow exceptions to propagate out.
		}
	}

	public send() {
		return new Promise<number>((resolve, reject) => {
			const start = process.hrtime();
			this.protocol.sendPayload({
				type: 'heartbeat',
				serverTime: Date.now()
			} as Payloads.Heartbeat, {
				resolve: () => {
					const hrInterval = process.hrtime(start);
					const latency = hrInterval[0] * MS_PER_S + hrInterval[1] * MS_PER_NS;
					this.protocol.conn.quality.latencyMs.update(latency);
					resolve(latency);
				},
				reject
			});
		});
	}
}
