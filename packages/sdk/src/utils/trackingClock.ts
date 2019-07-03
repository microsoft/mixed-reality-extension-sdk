/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Clock to estimate the current server time from a known sample.
 */
export class TrackingClock {
	private sampleMs = 0;
	private sampleTimeMs = Date.now();

	/**
	 * Returns the current server time in milliseconds, estimated from last known value.
	 */
	public get nowMs() {
		if (this.sampleTimeMs > 0) {
			const currentTimeMs = Date.now();
			const timespanMs = currentTimeMs - this.sampleTimeMs;
			const estimatedTimeMs = (this.sampleMs + timespanMs);
			return estimatedTimeMs;
		} else {
			return 0;
		}
	}

	/**
	 * Updates the last known server time.
	 * @param valueMs The value, in milliseconds.
	 */
	public update(valueMs: number) {
		if (valueMs > this.sampleMs) {
			this.sampleMs = valueMs;
			this.sampleTimeMs = Date.now();
		}
	}
}
