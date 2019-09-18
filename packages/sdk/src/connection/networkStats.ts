/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';

/** @hidden */
type NetworkStatsFrame = {
	messageCount: number;
	trafficIn: number;
	trafficOut: number;
};

/** A collection of network statistics from a certain point in time. */
export interface NetworkStatsReport {
	/**
	 * The average incoming bandwidth of this app over the last 1/5/30 seconds, in KB/s. This is roughly equivalent
	 * to the bandwidth sent by the busiest client over the interval, though does not correlate exactly.
	 * Only MRE internal traffic is counted, not general HTTP requests (static file hosting, etc.).
	 */
	networkBandwidthIn: [number, number, number];
	/**
	 * The average outgoing bandwidth of this app over the last 1/5/30 seconds, in KB/s. This is roughly equivalent
	 * to the bandwidth sent to the busiest client over the interval, though this does not correlate exactly.
	 * Only MRE internal traffic is counted, not general HTTP requests (static file hosting, etc.).
	 */
	networkBandwidthOut: [number, number, number];
	/**
	 * The number of messages sent and received by this app in the last 1/5/30 seconds. A high number might indicate
	 * that clients are wasting CPU cycles serializing and deserializing messages.
	 */
	networkMessageCount: [number, number, number];
}

/**
 * @hidden
 */
export class NetworkStatsTracker extends EventEmitter {
	private buffer: NetworkStatsFrame[] = [];
	private active: NetworkStatsFrame = {
		messageCount: 0,
		trafficIn: 0,
		trafficOut: 0
	};

	constructor() {
		super();
		setInterval(() => this.cycleStatFrames(), 1000);
	}

	/** @private */
	public recordOutgoing(bytes: number) {
		this.active.trafficOut += bytes / 1000;
		this.active.messageCount++;
		this.emit('outgoing', bytes);
	}

	/** @private */
	public recordIncoming(bytes: number) {
		this.active.trafficIn += bytes / 1000;
		this.active.messageCount++;
		this.emit('incoming', bytes);
	}

	/** @private */
	public reportStats(): NetworkStatsReport {
		const data = [this.buffer.slice(0, 1), this.buffer.slice(0, 5), this.buffer.slice(0, 30)];
		return {
			networkBandwidthIn: data.map(
				arr => arr.reduce((sum, f) => sum += f.trafficIn, 0) / (arr.length || 1)
			) as [number, number, number],
			networkBandwidthOut: data.map(
				arr => arr.reduce((sum, f) => sum += f.trafficOut, 0) / (arr.length || 1)
			) as [number, number, number],
			networkMessageCount: data.map(
				arr => arr.reduce((sum, f) => sum += f.messageCount, 0)
			) as [number, number, number]
		};
	}

	private cycleStatFrames() {
		this.buffer = [this.active, ...this.buffer.slice(0, 29)];
		this.active = {
			trafficIn: 0,
			trafficOut: 0,
			messageCount: 0
		};
	}
}
