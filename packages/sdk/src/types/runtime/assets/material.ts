/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager, Texture } from '.';
import { ZeroGuid } from '../../../constants';
import { Color3, Color4, Color4Like, Vector2, Vector2Like } from '../../../math';
import { observe } from '../../../utils/observe';
import readPath from '../../../utils/readPath';
import { InternalAsset } from '../../internal/asset';
import { Patchable } from '../../patchable';

/**
 * Describes the properties of a Material.
 */
export interface MaterialLike {
    /** The base color of this material. */
    color: Partial<Color4Like>;
    /** The main (albedo) texture asset ID */
    mainTextureId: string;
    /** The main texture's offset from default */
    mainTextureOffset: Vector2Like;
    /** The main texture's scale from default */
    mainTextureScale: Vector2Like;
    /** How the color/texture's alpha channel should be handled */
    alphaMode: AlphaMode;
    /** Visibility threshold in masked alpha mode */
    alphaCutoff: number;
}

/**
 * Controls how transparency is handled.
 */
export enum AlphaMode {
    /** The object is rendered opaque, and transparency info is discarded. */
    Opaque = 'opaque',
    /**
     * Any parts with alpha above a certain cutoff ([[Material.alphaCutoff]])
     * will be rendered solid. Everything else is fully transparent.
     */
    Mask = 'mask',
    /**
     * A pixel's transparency is directly proportional to its alpha value.
     */
    Blend = 'blend'
}

/**
 * Represents a material on a mesh.
 */
export class Material extends Asset implements MaterialLike, Patchable<AssetLike> {
    // tslint:disable:variable-name
    private _color = Color4.FromColor3(Color3.White(), 1.0);
    private _mainTextureId: string = ZeroGuid;
    private _mainTextureOffset = Vector2.Zero();
    private _mainTextureScale = Vector2.One();
    private _alphaMode = AlphaMode.Opaque;
    private _alphaCutoff = 0.5;
    private _internal = new InternalAsset(this);
    // tslint:enable:variable-name

    /** @hidden */
    public get internal() { return this._internal; }

    /** @inheritdoc */
    public get color() { return this._color; }
    public set color(value) { if (value) { this._color.copy(value); } }

    /** @returns A shared reference to this material's texture asset */
    public get mainTexture() { return this.manager.assets[this._mainTextureId] as Texture; }
    public set mainTexture(value) {
        this.mainTextureId = value && value.id || ZeroGuid;
    }

    /** @inheritdoc */
    public get mainTextureId() { return this._mainTextureId; }
    public set mainTextureId(value) {
        if (!value || value.startsWith('0000')) {
            value = ZeroGuid;
        }
        if (!this.manager.assets[value]) {
            value = ZeroGuid; // throw?
        }
        this._mainTextureId = value;
        this.materialChanged('mainTextureId');
    }

    /** @inheritdoc */
    public get mainTextureOffset() { return this._mainTextureOffset; }
    public set mainTextureOffset(value) { if (value) { this._mainTextureOffset.copy(value); } }

    /** @inheritdoc */
    public get mainTextureScale() { return this._mainTextureScale; }
    public set mainTextureScale(value) { if (value) { this._mainTextureScale.copy(value); } }

    /** @inheritdoc */
    public get alphaMode() { return this._alphaMode; }
    public set alphaMode(value) { this._alphaMode = value; this.materialChanged('alphaMode'); }

    /** @inheritdoc */
    public get alphaCutoff() { return this._alphaCutoff; }
    public set alphaCutoff(value) { this._alphaCutoff = value; this.materialChanged('alphaCutoff'); }

    /** @inheritdoc */
    public get material(): MaterialLike { return this; }

    /** INTERNAL USE ONLY. To create a new material from scratch, use [[AssetManager.createMaterial]]. */
    public constructor(manager: AssetManager, def: AssetLike) {
        super(manager, def);

        if (!def.material) {
            throw new Error("Cannot construct material from non-material definition");
        }

        if (def.material.color) {
            this._color.copy(def.material.color);
        }
        if (def.material.mainTextureId) {
            this._mainTextureId = def.material.mainTextureId;
        }
        if (def.material.mainTextureOffset) {
            this._mainTextureOffset.copy(def.material.mainTextureOffset);
        }
        if (def.material.mainTextureScale) {
            this._mainTextureScale.copy(def.material.mainTextureScale);
        }
        if (def.material.alphaMode) {
            this._alphaMode = def.material.alphaMode;
        }
        if (def.material.alphaCutoff) {
            this._alphaCutoff = def.material.alphaCutoff;
        }

        // material patching: observe the nested material properties
        // for changed values, and write them to a patch
        observe({
            target: this._color,
            targetName: 'color',
            notifyChanged: (...path: string[]) => this.materialChanged(...path)
        });
        observe({
            target: this._mainTextureOffset,
            targetName: 'mainTextureOffset',
            notifyChanged: (...path: string[]) => this.materialChanged(...path)
        });
        observe({
            target: this._mainTextureScale,
            targetName: 'mainTextureScale',
            notifyChanged: (...path: string[]) => this.materialChanged(...path)
        });
    }

    public copy(from: Partial<AssetLike>): this {
        if (!from) {
            return this;
        }

        // Pause change detection while we copy the values into the actor.
        const wasObserving = this.internal.observing;
        this.internal.observing = false;

        super.copy(from);
        if (from.material) {
            if (from.material.color) {
                this._color.copy(from.material.color);
            }
            if (from.material.mainTextureOffset) {
                this._mainTextureOffset.copy(from.material.mainTextureOffset);
            }
            if (from.material.mainTextureScale) {
                this._mainTextureScale.copy(from.material.mainTextureScale);
            }
            this._mainTextureId = from.material.mainTextureId || null;
            this._alphaMode = from.material.alphaMode || AlphaMode.Opaque;
            this._alphaCutoff = from.material.alphaCutoff || 0.5;
        }

        this.internal.observing = wasObserving;
        return this;
    }

    /** @hidden */
    public toJSON(): AssetLike {
        return {
            ...super.toJSON(),
            material: {
                color: this.color.toJSON(),
                mainTextureId: this.mainTextureId,
                mainTextureOffset: this.mainTextureOffset.toJSON(),
                mainTextureScale: this.mainTextureScale.toJSON(),
                alphaMode: this.alphaMode,
                alphaCutoff: this.alphaCutoff
            }
        };
    }

    private materialChanged(...path: string[]): void {
        if (this.internal.observing) {
            this.manager.context.internal.incrementGeneration();
            this.internal.patch = this.internal.patch || { material: {} } as AssetLike;
            readPath(this, this.internal.patch.material, ...path);
        }
    }
}
