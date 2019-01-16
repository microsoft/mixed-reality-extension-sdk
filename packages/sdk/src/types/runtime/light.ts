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
    public enabled: boolean;
    public type: LightType;
    public intensity: number;
    // spot- and point-only:
    public range: number;
    // spot-only:
    public spotAngle: number;

    // tslint:disable:variable-name
    private _color: Color3;
    // tslint:disable:variable-name

    public get color() { return this._color; }
    public set color(value: Partial<Color3>) { this._color.copy(value); }

    /**
     * PUBLIC METHODS
     */

    constructor() {
        this._color = Color3.White();
    }

    public copy(from: Partial<LightLike>): this {
        if (!from) return this;
        if (from.enabled !== undefined) this.enabled = from.enabled;
        if (from.type !== undefined) this.type = from.type;
        if (from.color !== undefined) this.color = from.color;
        if (from.range !== undefined) this.range = from.range;
        if (from.intensity !== undefined) this.intensity = from.intensity;
        if (from.spotAngle !== undefined) this.spotAngle = from.spotAngle;
        return this;
    }

    public toJSON() {
        return {
            enabled: this.enabled,
            type: this.type,
            color: this.color.toJSON(),
            range: this.range,
            intensity: this.intensity,
            spotAngle: this.spotAngle,
        } as LightLike;
    }
}
