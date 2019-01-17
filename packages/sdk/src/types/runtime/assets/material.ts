/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';
import { Color3, Color4 } from '../../../math';
import observe from '../../../utils/observe';
import readPath from '../../../utils/readPath';
import { InternalMaterial } from '../../internal/material';
import { Patchable } from '../../patchable';

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
export class Material extends Asset implements MaterialLike, Patchable<AssetLike> {
    // tslint:disable:variable-name
    private _color = Color4.FromColor3(Color3.White(), 1.0);
    private _internal = new InternalMaterial(this);
    // tslint:enable:variable-name

    /** @hidden */
    public get internal() { return this._internal; }

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
        observe(this._color, 'color', (...path: string[]) => this.materialChanged(path));
    }

    public copy(from: Partial<AssetLike>): this {
        if (!from) {
            return this;
        }

        // Pause change detection while we copy the values into the actor.
        const wasObserving = this.internal.observing;
        this.internal.observing = false;

        // tslint:disable:curly
        super.copy(from);
        if (from.material && from.material.color)
            this._color.copy(from.material.color);
        // tslint:enable:curly

        this.internal.observing = wasObserving;
        return this;
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

    private materialChanged(path: string[]): void {
        if (this.internal.observing) {
            this.manager.context.internal.incrementGeneration();
            this.internal.patch = this.internal.patch || {} as AssetLike;
            readPath(this, this.internal.patch, ...path);
        }
    }
}
