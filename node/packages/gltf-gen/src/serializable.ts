/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as GLTF from './gen/gltf';

export abstract class Serializable {
    protected cachedSerialId: GLTF.GlTfId;
    public abstract serialize(document: GLTF.GlTf, buffer: Buffer): GLTF.GlTfId;

    protected scanList: number[] = [];
    public abstract getByteSize(scanId: number): number;
}
