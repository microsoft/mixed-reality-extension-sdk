/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Color3, Color4 } from '@microsoft/mixed-reality-extension-sdk';
import { AlphaMode } from './enums';
import GLTF from './gen/gltf';
import { Serializable } from './serializable';
import { Texture } from './texture';

export class Material extends Serializable {
    public name: string;

    public baseColorTexture: Texture;
    public baseColorTexCoord = 0;
    public baseColorFactor: Color4 = new Color4(1, 1, 1, 1);

    public metallicRoughnessTexture: Texture;
    public metallicRoughnessTexCoord = 0;
    public metallicFactor = 1;
    public roughnessFactor = 1;

    public normalTexture: Texture;
    public normalTexCoord = 0;
    public normalTexScale = 1;

    public occlusionTexture: Texture;
    public occlusionTexCoord = 0;
    public occlusionTexStrength = 1;

    public emissiveTexture: Texture;
    public emissiveTexCoord = 0;
    public emissiveFactor: Color3 = new Color3(0, 0, 0);

    public alphaMode: AlphaMode = AlphaMode.Opaque;
    public alphaCutoff = 0.5;

    public doubleSided = false;

    constructor({
        name,
        baseColorTexture,
        baseColorTexCoord,
        baseColorFactor,
        metallicRoughnessTexture,
        metallicRoughnessTexCoord,
        metallicFactor,
        roughnessFactor,
        normalTexture,
        normalTexCoord,
        normalTexScale,
        occlusionTexture,
        occlusionTexCoord,
        occlusionTexStrength,
        emissiveTexture,
        emissiveTexCoord,
        emissiveFactor,
        alphaMode,
        alphaCutoff,
        doubleSided
    }: {
            name?: string,
            baseColorTexture?: Texture,
            baseColorTexCoord?: number,
            baseColorFactor?: Color4,
            metallicRoughnessTexture?: Texture,
            metallicRoughnessTexCoord?: number,
            metallicFactor?: number,
            roughnessFactor?: number,
            normalTexture?: Texture,
            normalTexCoord?: number,
            normalTexScale?: number,
            occlusionTexture?: Texture,
            occlusionTexCoord?: number,
            occlusionTexStrength?: number,
            emissiveTexture?: Texture,
            emissiveTexCoord?: number,
            emissiveFactor?: Color3,
            alphaMode?: AlphaMode,
            alphaCutoff?: number,
            doubleSided?: boolean
        } = {}) {
        super();
        this.name = name;
        this.baseColorTexture = baseColorTexture;
        this.baseColorTexCoord = baseColorTexCoord || this.baseColorTexCoord;
        this.baseColorFactor = baseColorFactor || this.baseColorFactor;
        this.metallicRoughnessTexture = metallicRoughnessTexture;
        this.metallicRoughnessTexCoord = metallicRoughnessTexCoord || this.metallicRoughnessTexCoord;
        this.metallicFactor = metallicFactor || this.metallicFactor;
        this.roughnessFactor = roughnessFactor || this.roughnessFactor;
        this.normalTexture = normalTexture;
        this.normalTexCoord = normalTexCoord || this.normalTexCoord;
        this.normalTexScale = normalTexScale || this.normalTexScale;
        this.occlusionTexture = occlusionTexture;
        this.occlusionTexCoord = occlusionTexCoord || this.occlusionTexCoord;
        this.occlusionTexStrength = occlusionTexStrength || this.occlusionTexStrength;
        this.emissiveTexture = emissiveTexture;
        this.emissiveTexCoord = emissiveTexCoord || this.emissiveTexCoord;
        this.emissiveFactor = emissiveFactor || this.emissiveFactor;
        this.alphaMode = alphaMode || this.alphaMode;
        this.alphaCutoff = alphaCutoff || this.alphaCutoff;
        this.doubleSided = doubleSided || this.doubleSided;
    }

    public serialize(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
        if (this.cachedSerialId !== undefined) {
            return this.cachedSerialId;
        }

        const mat: GLTF.Material = {
            name: this.name,
            pbrMetallicRoughness: {
                baseColorFactor: this.baseColorFactor.asArray(),
                metallicFactor: this.metallicFactor,
                roughnessFactor: this.roughnessFactor
            }
        };
        const pbr = mat.pbrMetallicRoughness;

        if (this.name) {
            mat.name = this.name;
        }

        if (this.baseColorTexture) {
            pbr.baseColorTexture = {
                index: this.baseColorTexture.serialize(document, data)
            };
            if (this.baseColorTexCoord !== 0) {
                pbr.baseColorTexture.texCoord = this.baseColorTexCoord;
            }
        }

        if (this.metallicRoughnessTexture) {
            pbr.metallicRoughnessTexture = {
                index: this.metallicRoughnessTexture.serialize(document, data)
            };
            if (this.metallicRoughnessTexCoord !== 0) {
                pbr.metallicRoughnessTexture.texCoord = this.metallicRoughnessTexCoord;
            }
        }

        if (this.normalTexture) {
            mat.normalTexture = {
                index: this.normalTexture.serialize(document, data)
            };
            if (this.normalTexCoord !== 0) {
                mat.normalTexture.texCoord = this.normalTexCoord;
            }
            if (this.normalTexScale !== 1) {
                mat.normalTexture.scale = this.normalTexScale;
            }
        }

        if (this.occlusionTexture) {
            mat.occlusionTexture = {
                index: this.occlusionTexture.serialize(document, data)
            };
            if (this.occlusionTexCoord !== 0) {
                mat.occlusionTexture.texCoord = this.occlusionTexCoord;
            }
            if (this.occlusionTexStrength !== 1) {
                mat.occlusionTexture.strength = this.occlusionTexStrength;
            }
        }

        if (!this.emissiveFactor.equalsFloats(0, 0, 0)) {
            mat.emissiveFactor = this.emissiveFactor.asArray();
        }

        if (this.emissiveTexture) {
            mat.emissiveTexture = {
                index: this.emissiveTexture.serialize(document, data)
            };
            if (this.emissiveTexCoord !== 0) {
                mat.emissiveTexture.texCoord = this.emissiveTexCoord;
            }
        }

        if (this.alphaMode !== AlphaMode.Opaque) {
            mat.alphaMode = this.alphaMode;
            mat.alphaCutoff = this.alphaCutoff;
        }

        if (!document.materials) {
            document.materials = [];
        }
        document.materials.push(mat);

        return this.cachedSerialId = document.materials.length - 1;
    }

    public getByteSize(scanId: number): number {
        if (this.scanList.includes(scanId)) {
            return 0;
        } else {
            this.scanList.push(scanId);
        }

        return [
            this.baseColorTexture,
            this.metallicRoughnessTexture,
            this.normalTexture,
            this.occlusionTexture,
            this.emissiveTexture]
            .reduce((acc, t) => acc + (t ? t.getByteSize(scanId) : 0), 0);
    }
}
