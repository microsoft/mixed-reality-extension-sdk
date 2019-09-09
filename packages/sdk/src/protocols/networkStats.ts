/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Middleware } from '.';
import { Message } from '..';
import { ExportedPromise } from '../utils/exportedPromise';
import filterEmpty from '../utils/filterEmpty';
import validateJsonFieldName from '../utils/validateJsonFieldName';

export interface NetworkStatsFrame {
	messageCount: number;
	trafficIn: number;
	trafficOut: number;
}

export interface NetworkStatsReport {
	/**
	 * The average incoming bandwidth of this app over the last 1/5/30 seconds, in KB/s. This is roughly equivalent
	 * to the bandwidth sent by a single steady-state client over the interval, though does not correlate exactly.
	 * Only MRE internal traffic is counted, not general HTTP requests (static file hosting, etc.).
	 */
	networkBandwidthIn: [number, number, number];
	/**
	 * The average outgoing bandwidth of this app over the last 1/5/30 seconds, in KB/s. This is roughly equivalent
	 * to the bandwidth sent by the busiest client over the interval, though does not correlate exactly.
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
export class NetworkStats implements Middleware {
	private buffer: NetworkStatsFrame[] = [];
	private active: NetworkStatsFrame = {
		messageCount: 0,
		trafficIn: 0,
		trafficOut: 0
	};

	constructor() {
		this.beforeSend = this.beforeSend.bind(this);
		this.beforeRecv = this.beforeRecv.bind(this);
		setInterval(() => this.cycleStatFrames(), 1000);
	}

	/** @private */
	public beforeSend(message: Message, promise?: ExportedPromise): Message {
		const data = new Buffer(JSON.stringify(message, (key, value) => {
			validateJsonFieldName(key);
			return filterEmpty(value);
		}));
		this.active.trafficOut += data.byteLength / 1000;
		this.active.messageCount++;
		return message;
	}

	/** @private */
	public beforeRecv(message: Message): Message {
		const data = new Buffer(JSON.stringify(message, (key, value) => {
			validateJsonFieldName(key);
			return filterEmpty(value);
		}));
		this.active.trafficOut += data.byteLength / 1000;
		this.active.messageCount++;
		return message;
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
