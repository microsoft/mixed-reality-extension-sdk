/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';
import { Color3, Color4 } from '../../../math';

/**
 * Describes the properties of a Material.
 */
export interface MaterialLike {
    /** The base color of this material. */
    color: Partial<Color4>;
}

/**
 * Controls how transparency is handled.
 */
export enum AlphaMode {
    /** The object is rendered opaque, and transparency info is discarded. */
    Opaque = 'Opaque',
    /**
     * Any parts with alpha above a certain cutoff ([[Material.alphaCutoff]])
     * will be rendered solid. Everything else is fully transparent.
     */
    Mask = 'Mask',
    /**
     * A pixel's transparency is directly proportional to its alpha value.
     */
    Blend = 'Blend'
}

/**
 * Represents a material on a mesh.
 */
export class Material extends Asset implements MaterialLike {
    // tslint:disable:variable-name
    private _color = Color4.FromColor3(Color3.White(), 1.0);
    // tslint:enable:variable-name

    /** @inheritdoc */
    public get color() { return this._color; }

    /** @inheritdoc */
    public get material(): MaterialLike { return this; }

    public constructor(manager: AssetManager, def: AssetLike) {
        super(manager, def);

        if (!def.material) {
            throw new Error("Cannot construct material from non-material definition");
        }

        this._color.copy(def.material.color);

        // materials are immutable for now, so don't let people change
        // the color, for fear of desync
        Object.freeze(this._color);
    }

    /** @hidden */
    public toJSON(): AssetLike {
        return {
            ...super.toJSON(),
            material: {
                color: this._color.toJSON()
            }
        };
    }
}
