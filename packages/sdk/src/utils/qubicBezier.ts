/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const A = (aA1: number, aA2: number): number => 1.0 - 3.0 * aA2 + 3.0 * aA1;
const B = (aA1: number, aA2: number): number => 3.0 * aA2 - 6.0 * aA1;
const C = (aA1: number): number => 3.0 * aA1;
// Use Horner's method to calculate the polynomial.
// https://en.wikipedia.org/wiki/Horner%27s_method
const calcBezier = (t: number, aA1: number, aA2: number): number =>
    ((A(aA1, aA2) * t + B(aA1, aA2)) * t + C(aA1)) * t;
const getSlope = (t: number, aA1: number, aA2: number): number =>
    3.0 * A(aA1, aA2) * t * t + 2.0 * B(aA1, aA2) * t + C(aA1);

const SPLINE_TABLE_SIZE = 11;
const SAMPLE_STEP_SIZE = 1.0 / (SPLINE_TABLE_SIZE - 1);
const NEWTON_MIN_SLOPE = 0.001;
const NEWTON_ITERATIONS = 4;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;

/**
 * Calculates a value along a two-point bezier curve.
 * Implementation based on this article:
 * http://greweb.me/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
 * and https://github.com/gre/bezier-easing
 */
export class CubicBezier {
    private readonly mX1: number;
    private readonly mY1: number;
    private readonly mX2: number;
    private readonly mY2: number;

    private readonly mSampleValues: number[] = [];

    /**
     * Creates a CubicBezier instance.
     * @param x1 X component of first control point.
     * @param y1 Y component of first control point.
     * @param x2 X component of second control point.
     * @param y2 Y component of second control point.
     */
    public constructor(x1: number, y1: number, x2: number, y2: number) {
        this.mX1 = x1;
        this.mY1 = y1;
        this.mX2 = x2;
        this.mY2 = y2;

        // Precalculate some sample points.
        if (this.mX1 !== this.mY1 || this.mX2 !== this.mY2) {
            for (let i = 0; i < SPLINE_TABLE_SIZE; ++i) {
                this.mSampleValues[i] = calcBezier(i * SAMPLE_STEP_SIZE, this.mX1, this.mX2);
            }
        }
    }

    /// <summary>
    /// Calculate the value at the given point along the curve.
    /// </summary>
    /// <param name="val">The location at which to sample the curve. Must be in [0, 1] range.</param>
    /// <returns>The calculated value.</returns>
    public sample(val: number) {
        if (val <= 0) {
            return 0;
        }
        if (val >= 1) {
            return 1;
        }
        if (this.mX1 === this.mY1 && this.mX2 === this.mY2) {
            // Early-out for linear
            return val;
        }
        return calcBezier(this.getTForX(val), this.mY1, this.mY2);
    }

    private getTForX(aX: number): number {
        // Find the interval where t lies to get us in the ballpark.
        let intervalStart = 0.0;
        let currentSample = 1;
        const lastSample = SPLINE_TABLE_SIZE - 1;
        for (; currentSample !== lastSample && this.mSampleValues[currentSample] <= aX; ++currentSample) {
            intervalStart += SAMPLE_STEP_SIZE;
        }
        --currentSample;

        // Calulate the initial guess for t.
        const dist =
            (aX - this.mSampleValues[currentSample]) /
            (this.mSampleValues[currentSample + 1] - this.mSampleValues[currentSample]);
        const guessForT = intervalStart + dist * SAMPLE_STEP_SIZE;

        // If the slope is too small, Newton-Raphson iteration won't converge on a root, so use dichotomic search.
        const initialSlope = getSlope(guessForT, this.mX1, this.mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
            return this.newtonRaphsonIterate(aX, guessForT);
        } else if (initialSlope === 0.0) {
            return guessForT;
        } else {
            return this.binarySubdivide(aX, intervalStart, intervalStart + SAMPLE_STEP_SIZE);
        }
    }

    private newtonRaphsonIterate(aX: number, aGuessT: number) {
        for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
            const currentSlope = getSlope(aGuessT, this.mX1, this.mX2);
            if (currentSlope === 0.0) {
                return aGuessT;
            }
            const currentX = calcBezier(aGuessT, this.mX1, this.mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }

    private binarySubdivide(aX: number, aA: number, aB: number) {
        let currentX;
        let currentT;
        let i = 0;

        do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, this.mX1, this.mX2) - aX;

            if (currentX > 0.0) {
                aB = currentT;
            } else {
                aA = currentT;
            }
        } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

        return currentT;
    }
}
