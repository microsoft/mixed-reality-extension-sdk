/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/** Control points of a cubic bezier curve. @see [[AnimationEaseCurves]]. */
export type EaseCurve = [number, number, number, number];

/**
 * Predefined ease curves from https://easings.net/. Curve shapes can be previewed there.
 * Create your own at http://cubic-bezier.com.
 * Note: Curves that end with "Back" include some overshoot.
 */
export const AnimationEaseCurves = {
	// Linear: Move at constant speed.
	Linear: [0, 0, 1, 1] as EaseCurve,
	// Step: Do not interpolate.
	Step: [0, 0, 0, 0] as EaseCurve,
	// Ease-in curves (each curve is progressively more dissimilar from Linear)
	EaseInSine: [0.47, 0, 0.745, 0.715] as EaseCurve,
	EaseInQuadratic: [0.55, 0.085, 0.68, 0.53] as EaseCurve,
	EaseInCubic: [0.55, 0.055, 0.675, 0.19] as EaseCurve,
	EaseInQuartic: [0.895, 0.03, 0.685, 0.22] as EaseCurve,
	EaseInQuintic: [0.755, 0.05, 0.855, 0.06] as EaseCurve,
	EaseInExponential: [0.95, 0.05, 0.795, 0.035] as EaseCurve,
	EaseInCircular: [0.6, 0.04, 0.98, 0.335] as EaseCurve,
	EaseInBack: [0.6, -0.28, 0.735, 0.045] as EaseCurve,
	// Ease-out curves (each curve is progressively more dissimilar from Linear)
	EaseOutSine: [0.39, 0.575, 0.565, 1] as EaseCurve,
	EaseOutQuadratic: [0.25, 0.46, 0.45, 0.94] as EaseCurve,
	EaseOutCubic: [0.215, 0.61, 0.355, 1] as EaseCurve,
	EaseOutQuartic: [0.165, 0.84, 0.44, 1] as EaseCurve,
	EaseOutQuintic: [0.23, 1, 0.32, 1] as EaseCurve,
	EaseOutExponential: [0.19, 1, 0.22, 1] as EaseCurve,
	EaseOutCircular: [0.075, 0.82, 0.165, 1] as EaseCurve,
	EaseOutBack: [0.175, 0.885, 0.32, 1.275] as EaseCurve,
	// Ease-in-out curves (each curve is progressively more dissimilar from Linear)
	EaseInOutSine: [0.445, 0.05, 0.55, 0.95] as EaseCurve,
	EaseInOutQuadratic: [0.455, 0.03, 0.515, 0.955] as EaseCurve,
	EaseInOutCubic: [0.645, 0.045, 0.355, 1] as EaseCurve,
	EaseInOutQuartic: [0.77, 0, 0.175, 1] as EaseCurve,
	EaseInOutQuintic: [0.86, 0, 0.07, 1] as EaseCurve,
	EaseInOutExponential: [1, 0, 0, 1] as EaseCurve,
	EaseInOutCircular: [0.785, 0.135, 0.15, 0.86] as EaseCurve,
	EaseInOutBack: [0.68, -0.55, 0.265, 1.55] as EaseCurve,
};
