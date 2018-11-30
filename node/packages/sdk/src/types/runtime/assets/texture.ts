/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';

export interface TextureLike {
    wrapU: TextureWrapMode;
    wrapV: TextureWrapMode;
}

/** How a material should interpret UV coordinates outside the [0,1) range. */
export enum TextureWrapMode {
    /** The texture is tiled for every 1 unit in the UVs. */
    Repeat = 'Repeat',
    /** The edge pixels of the texture are stretched out to the bounds of the UVs. */
    Clamp = 'Clamp',
    /** The texture is tiled and flipped for every 1 unit in the UVs. */
    MirroredRepeat = 'MirroredRepeat'
}

export class Texture extends Asset implements TextureLike {
    // tslint:disable:variable-name
    private _wrapU = TextureWrapMode.Repeat;
    private _wrapV = TextureWrapMode.Repeat;
    // tslint:enable:variable-name

    /** How overflowing UVs are handled horizontally. */
    public get wrapU() { return this._wrapU; }
    public set wrapU(val) { this._wrapU = val; }

    /** How overflowing UVs are handled vertically. */
    public get wrapV() { return this._wrapV; }
    public set wrapV(val) { this._wrapV = val; }

    /** @inheritdoc */
    public get texture(): TextureLike { return this; }

    public constructor(manager: AssetManager, def: AssetLike) {
        super(manager, def);

        if (!def.texture) {
            throw new Error("Cannot construct texture from non-texture definition");
        }

        this._wrapU = def.texture.wrapU;
        this._wrapV = def.texture.wrapV;
    }

    /** @hidden */
    public toJSON(): AssetLike {
        return {
            ...super.toJSON(),
            texture: {
                wrapU: this.wrapU,
                wrapV: this.wrapV
            }
        };
    }
}
