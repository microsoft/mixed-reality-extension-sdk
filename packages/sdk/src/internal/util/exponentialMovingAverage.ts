/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Computes an Exponentially Weighted Moving Average (EWMA).
 * https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average
 */
export class ExponentialMovingAverage {
	public alpha = 0.75;
	public value = 0;

	/** Computes the latest value given a new sample */
	public update(v: number): void {
		if (typeof v === 'number') {
			this.value = this.alpha * v + (1 - this.alpha) * this.value;
		}
	}
}
