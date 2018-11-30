/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Color3, Color3Like } from '../..';

export enum TextAnchorLocation {
    TopLeft = 'TopLeft',
    TopCenter = 'TopCenter',
    TopRight = 'TopRight',
    MiddleLeft = 'MiddleLeft',
    MiddleCenter = 'MiddleCenter',
    MiddleRight = 'MiddleRight',
    BottomLeft = 'BottomLeft',
    BottomCenter = 'BottomCenter',
    BottomRight = 'BottomRight',
}

export enum TextJustify {
    Left = 'Left',
    Center = 'Center',
    Right = 'Right',
}

export enum TextFontFamily {
    Serif = 'Serif',
    SansSerif = 'SansSerif',
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
    // tslint:disable:variable-name
    private _enabled = true;
    private _contents = '';
    private _height = 1;
    private _pixelsPerLine = 50;
    private _anchor: TextAnchorLocation = TextAnchorLocation.TopLeft;
    private _justify: TextJustify = TextJustify.Left;
    private _font: TextFontFamily = TextFontFamily.SansSerif;
    private _color: Color3 = Color3.White();
    // tslint:enable:variable-name

    /**
     * Whether or not to draw the text
     */
    public get enabled() { return this._enabled; }
    public set enabled(value) { this._enabled = value; }

    /**
     * The text string to be drawn
     */
    public get contents() { return this._contents; }
    public set contents(value) { this._contents = value; }

    /**
     * The height in meters of a line of text
     */
    public get height() { return this._height; }
    public set height(value) { this._height = value; }

    /**
     * The vertical resolution of a single line of text
     */
    public get pixelsPerLine() { return this._pixelsPerLine; }
    public set pixelsPerLine(value) { this._pixelsPerLine = value; }

    /**
     * The position of the text anchor relative to the block of text
     */
    public get anchor() { return this._anchor; }
    public set anchor(value) { this._anchor = value; }

    /**
     * The alignment of each text line relative to the others
     */
    public get justify() { return this._justify; }
    public set justify(value) { this._justify = value; }

    /**
     * The font family to use to draw the text
     */
    public get font() { return this._font; }
    public set font(value) { this._font = value; }

    /**
     * The text's color
     */
    public get color() { return this._color; }
    public set color(value: Partial<Color3>) { this._color.copy(value); }

    public copyDirect(text: Partial<TextLike>): this {
        // tslint:disable:curly
        if (!text) return this;
        if (typeof text.enabled !== 'undefined') this._enabled = text.enabled;
        if (typeof text.contents !== 'undefined') this._contents = text.contents;
        if (typeof text.height !== 'undefined') this._height = text.height;
        if (typeof text.pixelsPerLine !== 'undefined') this._pixelsPerLine = text.pixelsPerLine;
        if (typeof text.anchor !== 'undefined') this._anchor = text.anchor;
        if (typeof text.justify !== 'undefined') this._justify = text.justify;
        if (typeof text.font !== 'undefined') this._font = text.font;
        if (typeof text.color !== 'undefined') this._color.copyDirect(text.color);
        return this;
        // tslint:enable:curly
    }

    public toJSON() {
        return {
            enabled: this._enabled,
            contents: this._contents,
            height: this._height,
            pixelsPerLine: this._pixelsPerLine,
            anchor: this._anchor,
            justify: this._justify,
            font: this._font,
            color: this._color ? this._color.toJSON() : undefined,
        } as TextLike;
    }
}
