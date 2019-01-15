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
    public color: Color3;
    public intensity: number;
    // spot- and point-only:
    public range: number;
    // spot-only:
    public spotAngle: number;

    /**
     * PUBLIC METHODS
     */

    constructor() {
        this.color = Color3.White();
    }

    public copy(from: Partial<LightLike>): this {
        if (!from) return this;
        if (from.enabled !== undefined) this.enabled = from.enabled;
        if (from.type !== undefined) this.type = from.type;
        if (from.color !== undefined) this.color.copy(from.color);
        if (from.range !== undefined) this.range = from.range;
        if (from.intensity !== undefined) this.intensity = from.intensity;
        if (from.spotAngle !== undefined) this.spotAngle = from.spotAngle;
        return this;
    }
}
