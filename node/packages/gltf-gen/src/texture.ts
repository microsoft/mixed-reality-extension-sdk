/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Image } from '.';
import { TextureMagFilter, TextureMinFilter, TextureWrapMode } from './enums';
import GLTF from './gen/gltf';
import { Serializable } from './serializable';

export interface TextureLike {
    name?: string,
    source?: Image,
    magFilter?: TextureMagFilter,
    minFilter?: TextureMinFilter,
    wrapS?: TextureWrapMode,
    wrapT?: TextureWrapMode
}

export class Texture extends Serializable implements TextureLike {

    public name: string;

    public source: Image;

    public magFilter: TextureMagFilter = TextureMagFilter.Linear;
    public minFilter: TextureMinFilter = TextureMinFilter.Linear;
    public wrapS: TextureWrapMode = TextureWrapMode.Repeat;
    public wrapT: TextureWrapMode = TextureWrapMode.Repeat;

    constructor(init: TextureLike = {}) {
        super();
        this.name = init.name;
        this.source = init.source;
        this.magFilter = init.magFilter || this.magFilter;
        this.minFilter = init.minFilter || this.minFilter;
        this.wrapS = init.wrapS || this.wrapS;
        this.wrapT = init.wrapT || this.wrapT;
    }

    public serialize(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
        if (this.cachedSerialId !== undefined) {
            return this.cachedSerialId;
        }

        const texture: GLTF.Texture = {
            name: this.name,
            source: this.source.serialize(document, data),
            sampler: this._serializeSampler(document, data)
        };

        if (!document.textures) {
            document.textures = [];
        }
        document.textures.push(texture);

        return this.cachedSerialId = document.textures.length - 1;
    }

    private _serializeSampler(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
        // get existing sampler with the same settings
        const samplerId = document.samplers ? document.samplers.findIndex(s =>
            s.wrapS === this.wrapS && s.wrapT === this.wrapT &&
            s.minFilter === this.minFilter && s.magFilter === this.magFilter)
            : -1;
        if (samplerId >= 0) {
            return samplerId;
        }

        const sampler: GLTF.Sampler = {
            wrapS: this.wrapS,
            wrapT: this.wrapT,
            minFilter: this.minFilter,
            magFilter: this.magFilter
        };

        if (!document.samplers) {
            document.samplers = [];
        }
        document.samplers.push(sampler);

        return document.samplers.length - 1;
    }

    public getByteSize(scanId: number): number {
        return this.source.getByteSize(scanId);
    }
}
