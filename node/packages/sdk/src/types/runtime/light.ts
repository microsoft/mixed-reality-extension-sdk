/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Color3, Color3Like } from '../..';

export type LightType = 'spot' | 'point' | 'directional';

export interface LightLike {
    enabled: boolean;
    type: LightType;
    color: Partial<Color3Like>;
    intensity: number;
    range: number;
    spotAngle: number;
}

export class Light implements LightLike {
    // tslint:disable:variable-name
    private _enabled: boolean;
    private _type: LightType;
    private _color: Color3;
    private _intensity: number;
    // spot- and point-only:
    private _range: number;
    // spot-only:
    private _spotAngle: number;
    // tslint:enable:variable-name

    /**
     * PUBLIC ACCESSORS
     */

    public get enabled() { return this._enabled; }
    public set enabled(value) { this._enabled = value; }
    public get type() { return this._type; }
    public set type(value) { this._type = value; }
    public get color() { return this._color; }
    public set color(value: Partial<Color3>) { this._color.copy(value); }
    public get range() { return this._range; }
    public set range(value) { this._range = value; }
    public get intensity() { return this._intensity; }
    public set intensity(value) { this._intensity = value; }
    public get spotAngle() { return this._spotAngle; }
    public set spotAngle(value) { this._spotAngle = value; }

    /**
     * PUBLIC METHODS
     */

    constructor() {
        this._color = Color3.White();
    }

    public copyDirect(light: Partial<LightLike>): this {
        // tslint:disable:curly
        if (!light) return this;
        if (typeof light.enabled !== 'undefined') this._enabled = light.enabled;
        if (typeof light.type !== 'undefined') this._type = light.type;
        if (typeof light.color !== 'undefined') this._color.copyDirect(light.color);
        if (typeof light.range !== 'undefined') this._range = light.range;
        if (typeof light.intensity !== 'undefined') this._intensity = light.intensity;
        if (typeof light.spotAngle !== 'undefined') this._spotAngle = light.spotAngle;
        return this;
        // tslint:enable:curly
    }

    public toJSON() {
        return {
            enabled: this._enabled,
            type: this._type,
            color: this._color.toJSON(),
            range: this._range,
            intensity: this._intensity,
            spotAngle: this._spotAngle,
        } as LightLike;
    }
}
