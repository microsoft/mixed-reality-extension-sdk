/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Material, Mesh, MeshPrimitive, Node, Scene, Texture } from '.';
import * as GLTF from './gen/gltf';
import { roundUpToNextMultipleOf4 } from './util';

/**
 * Generates a glTF document from mesh data
 */
export class GltfFactory {
    public textures: Texture[];
    public materials: Material[];
    public meshes: Mesh[];
    public scenes: Scene[];

    public constructor({ meshes, materials, textures, scenes }: {
        meshes?: Mesh[], materials?: Material[], textures?: Texture[], scenes?: Scene[]
    } = {}) {
        this.textures = textures || [];
        this.materials = materials || [];
        this.meshes = meshes || [];
        this.scenes = scenes || [];
    }

    /**
     * @returns A buffer containing a glTF document in GLB format
     */
    public generateGLTF(): Buffer {
        const scanId = Math.floor(1000000 * Math.random());
        const dataBufferSize =
            (this.textures.length ? this.textures.reduce((acc, t) => acc + t.getByteSize(scanId), 0) : 0) +
            (this.materials.length ? this.materials.reduce((acc, m) => acc + m.getByteSize(scanId), 0) : 0) +
            (this.meshes.length ? this.meshes.reduce((acc, m) => acc + m.getByteSize(scanId), 0) : 0) +
            (this.scenes.length ? this.scenes.reduce((acc, s) => acc + s.getByteSize(scanId), 0) : 0);

        const binaryData = Buffer.allocUnsafe(roundUpToNextMultipleOf4(dataBufferSize));

        const document: GLTF.GlTf = {
            asset: {
                version: '2.0',
                generator: '@microsoft/gltf-gen'
            }
        };

        if (binaryData.length > 0) {
            document.buffers = [{
                byteLength: dataBufferSize
            }];
        }

        this.textures.forEach(t => t.serialize(document, binaryData));
        this.materials.forEach(m => m.serialize(document, binaryData));
        this.meshes.forEach(m => m.serialize(document, binaryData));
        this.scenes.forEach(s => s.serialize(document, binaryData));

        let json = JSON.stringify(document);
        while (Buffer.byteLength(json, 'utf8') % 4 > 0) {
            json += ' ';
        }
        const jsonLength = Buffer.byteLength(json, 'utf8');

        const gltfData = Buffer.allocUnsafe(jsonLength + binaryData.length + 28);
        gltfData.writeUInt32LE(0x46546c67, 0); // "glTF"
        gltfData.writeUInt32LE(2, 4); // GLB version number
        gltfData.writeUInt32LE(gltfData.length, 8); // length of the total file

        gltfData.writeUInt32LE(jsonLength, 12); // length of the JSON
        gltfData.writeUInt32LE(0x4e4f534a, 16); // "JSON"
        gltfData.write(json, 20, jsonLength, 'utf8');

        gltfData.writeUInt32LE(binaryData.length, 20 + jsonLength); // length of the binary
        gltfData.writeUInt32LE(0x004e4942, 20 + jsonLength + 4); // " BIN"
        binaryData.copy(gltfData, 20 + jsonLength + 8);

        return gltfData;
    }

    public static FromSinglePrimitive(prim: MeshPrimitive): GltfFactory {
        return new GltfFactory({
            scenes: [new Scene({
                nodes: [
                    new Node({
                        mesh: new Mesh({
                            primitives: [prim]
                        })
                    })
                ]
            })]
        });
    }
}
