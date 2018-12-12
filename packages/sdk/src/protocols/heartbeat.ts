/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Protocol } from '.';
import * as Payloads from '../types/network/payloads';

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
            await this.send();
        }
    }

    public send(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const start = Date.now();
            this.protocol.sendPayload({
                type: 'heartbeat',
            } as Payloads.Heartbeat, {
                    resolve: () => {
                        const latency = (Date.now() - start);
                        this.protocol.conn.quality.latencyMs.update(latency);
                        resolve(latency);
                    },
                    reject
                });
        });
    }
}
