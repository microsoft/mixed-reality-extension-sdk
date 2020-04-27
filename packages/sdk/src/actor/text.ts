/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Color3, Color3Like } from '..';

export enum TextAnchorLocation {
	TopLeft = 'top-left',
	TopCenter = 'top-center',
	TopRight = 'top-right',
	MiddleLeft = 'middle-left',
	MiddleCenter = 'middle-center',
	MiddleRight = 'middle-right',
	BottomLeft = 'bottom-left',
	BottomCenter = 'bottom-center',
	BottomRight = 'bottom-right',
}

export enum TextJustify {
	Left = 'left',
	Center = 'center',
	Right = 'right',
}

/** Available text font types. If a type is unsupported by the MRE client, [[Default]] will be used. */
export enum TextFontFamily {
	/** The default engine font */
	Default = 'default',
	/** A font with serif strokes */
	Serif = 'serif',
	/** A font without serif strokes */
	SansSerif = 'sans-serif',
	/** A font where all characters are the same width */
	Monospace = 'monospace',
	/** A handwritten font */
	Cursive = 'cursive'
}

export interface TextLike {
	enabled: boolean;
	contents: string;
	height: number;
	pixelsPerLine: number;
	anchor: TextAnchorLocation;
	justify: TextJustify;
	font: TextFontFamily;
	color: Partial<Color3Like>;
}

export class Text implements TextLike {
	private _color: Color3;

	/**
	 * Whether or not to draw the text
	 */
	public enabled = true;
	/**
	 * The text string to be drawn
	 */
	public contents = '';
	/**
	 * The height in meters of a line of text
	 */
	public height = 1;
	/**
	 * The vertical resolution of a single line of text
	 */
	public pixelsPerLine = 50;
	/**
	 * The position of the text anchor relative to the block of text
	 */
	public anchor: TextAnchorLocation = TextAnchorLocation.TopLeft;
	/**
	 * The alignment of each text line relative to the others
	 */
	public justify: TextJustify = TextJustify.Left;
	/**
	 * The font family to use to draw the text
	 */
	public font: TextFontFamily = TextFontFamily.Default;
	/**
	 * The text's color
	 */
	public get color() { return this._color; }
	public set color(value: Partial<Color3>) { this._color.copy(value); }

	constructor() {
		this._color = Color3.White();
	}

	public copy(from: Partial<TextLike>): this {
		if (!from) { return this; }
		if (from.enabled !== undefined) { this.enabled = from.enabled; }
		if (from.contents !== undefined) { this.contents = from.contents; }
		if (from.height !== undefined) { this.height = from.height; }
		if (from.pixelsPerLine !== undefined) { this.pixelsPerLine = from.pixelsPerLine; }
		if (from.anchor !== undefined) { this.anchor = from.anchor; }
		if (from.justify !== undefined) { this.justify = from.justify; }
		if (from.font !== undefined) { this.font = from.font; }
		if (from.color !== undefined) { this.color = from.color; }
		return this;
	}

	public toJSON() {
		return {
			enabled: this.enabled,
			contents: this.contents,
			height: this.height,
			pixelsPerLine: this.pixelsPerLine,
			anchor: this.anchor,
			justify: this.justify,
			font: this.font,
			color: this.color.toJSON(),
		} as TextLike;
	}
}
