/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Predefined ease curves from https://easings.net/. Curve shapes can be previewed there.
 * Create your own at http://cubic-bezier.com.
 * Note: Curves that end with "Back" include some overshoot.
 */

export type EaseCurve = [number, number, number, number];

export const AnimationEaseCurves = {
	// Linear: Move at constant speed.
	Linear: [0, 0, 1, 1],
	// Ease-in curves (each curve is progressively more dissimilar from Linear)
	EaseInSine: [0.47, 0, 0.745, 0.715],
	EaseInQuadratic: [0.55, 0.085, 0.68, 0.53],
	EaseInCubic: [0.55, 0.055, 0.675, 0.19],
	EaseInQuartic: [0.895, 0.03, 0.685, 0.22],
	EaseInQuintic: [0.755, 0.05, 0.855, 0.06],
	EaseInExponential: [0.95, 0.05, 0.795, 0.035],
	EaseInCircular: [0.6, 0.04, 0.98, 0.335],
	EaseInBack: [0.6, -0.28, 0.735, 0.045],
	// Ease-out curves (each curve is progressively more dissimilar from Linear)
	EaseOutSine: [0.39, 0.575, 0.565, 1],
	EaseOutQuadratic: [0.25, 0.46, 0.45, 0.94],
	EaseOutCubic: [0.215, 0.61, 0.355, 1],
	EaseOutQuartic: [0.165, 0.84, 0.44, 1],
	EaseOutQuintic: [0.23, 1, 0.32, 1],
	EaseOutExponential: [0.19, 1, 0.22, 1],
	EaseOutCircular: [0.075, 0.82, 0.165, 1],
	EaseOutBack: [0.175, 0.885, 0.32, 1.275],
	// Ease-in-out curves (each curve is progressively more dissimilar from Linear)
	EaseInOutSine: [0.445, 0.05, 0.55, 0.95],
	EaseInOutQuadratic: [0.455, 0.03, 0.515, 0.955],
	EaseInOutCubic: [0.645, 0.045, 0.355, 1],
	EaseInOutQuartic: [0.77, 0, 0.175, 1],
	EaseInOutQuintic: [0.86, 0, 0.07, 1],
	EaseInOutExponential: [1, 0, 0, 1],
	EaseInOutCircular: [0.785, 0.135, 0.15, 0.86],
	EaseInOutBack: [0.68, -0.55, 0.265, 1.55],
} as { [name: string]: EaseCurve };
