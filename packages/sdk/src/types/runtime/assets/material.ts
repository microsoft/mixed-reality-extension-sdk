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
    color: Color4;
    /** The texture ID assigned to this material, if any. */
    textureId?: string;
    /**
     * How metallic this material is.
     * Metallic objects reflect light more strongly than non-metallic objects.
     */
    metallic: number;
    /**
     * How rough this material is.
     * Rough objects reflect light more diffusely than smooth ones.
     */
    roughness: number;
    /** How to interpret the alpha channels of this material's color and texture. */
    alphaMode: AlphaMode;
    /** If in Mask mode, the alpha value cutoff for visibility. */
    alphaCutoff: number;
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
    private _textureId: string;
    private _metallic = 0;
    private _roughness = 0.5;
    private _alphaMode = AlphaMode.Opaque;
    private _alphaCutoff = 0.5;
    // tslint:enable:variable-name

    /** @inheritdoc */
    public get color() { return this._color; }
    public set color(val) { this._color.copyFrom(val); }
    /** @inheritdoc */
    public get textureId() { return this._textureId; }
    public set textureId(val) { this._textureId = val; }
    /** @inheritdoc */
    public get metallic() { return this._metallic; }
    public set metallic(val) { this.metallic = val; }
    /** @inheritdoc */
    public get roughness() { return this._roughness; }
    public set roughness(val) { this.roughness = val; }
    /** @inheritdoc */
    public get alphaMode() { return this._alphaMode; }
    public set alphaMode(val) { this.alphaMode = val; }
    /** @inheritdoc */
    public get alphaCutoff() { return this._alphaCutoff; }
    public set alphaCutoff(val) { this.alphaCutoff = val; }

    /** @inheritdoc */
    public get material(): MaterialLike { return this; }

    public constructor(manager: AssetManager, def: AssetLike) {
        super(manager, def);

        if (!def.material) {
            throw new Error("Cannot construct material from non-material definition");
        }
    }

    /** @hidden */
    public toJSON(): AssetLike {
        throw new Error("Not implemented");
    }
}
