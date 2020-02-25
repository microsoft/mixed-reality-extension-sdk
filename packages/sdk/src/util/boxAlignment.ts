/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/** Describes a relative position in a [[GridLayout]]. */
export enum BoxAlignment {
	/** Position above and to the left of the anchor. */
	TopLeft = 'top-left',
	/** Position directly above the anchor. */
	TopCenter = 'top-center',
	/** Position above and to the right of the anchor. */
	TopRight = 'top-right',
	/** Position directly left of the anchor. */
	MiddleLeft = 'middle-left',
	/** Position directly on top of the anchor. */
	MiddleCenter = 'middle-center',
	/** Position directly right of the anchor. */
	MiddleRight = 'middle-right',
	/** Position below and to the left of the anchor. */
	BottomLeft = 'bottom-left',
	/** Position directly below the anchor. */
	BottomCenter = 'bottom-center',
	/** Position below and to the right of the anchor. */
	BottomRight = 'bottom-right',
}

export function InvertBoxAlignment(align: BoxAlignment) {
	switch (align) {
		case BoxAlignment.TopLeft: return BoxAlignment.BottomRight;
		case BoxAlignment.TopCenter: return BoxAlignment.BottomCenter;
		case BoxAlignment.TopRight: return BoxAlignment.BottomLeft;
		case BoxAlignment.MiddleLeft: return BoxAlignment.MiddleRight;
		case BoxAlignment.MiddleCenter: return BoxAlignment.MiddleCenter;
		case BoxAlignment.MiddleRight: return BoxAlignment.MiddleLeft;
		case BoxAlignment.BottomLeft: return BoxAlignment.TopRight;
		case BoxAlignment.BottomCenter: return BoxAlignment.TopCenter;
		case BoxAlignment.BottomRight: return BoxAlignment.TopLeft;
	}
}
