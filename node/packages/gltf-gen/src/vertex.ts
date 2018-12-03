/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector2, Vector3, Vector4 } from '@microsoft/mixed-reality-extension-sdk';
import {
    ColorAttribute,
    NormalAttribute,
    PositionAttribute,
    TangentAttribute,
    TexCoordAttribute,
    VertexAttribute
} from './vertexattributes';

type Attribute2 = Vector2 | [number, number];
type Attribute3 = Vector3 | [number, number, number];
type Attribute4 = Vector4 | [number, number, number, number];

export class Vertex {
    public position: Vector3;
    public normal: Vector3;
    public tangent: Vector4;
    public texCoord0: Vector2;
    public texCoord1: Vector2;
    public color0: Vector3;

    constructor({ position, normal, tangent, texCoord0, texCoord1, color0 }: {
        position?: Attribute3, normal?: Attribute3, tangent?: Attribute4,
        texCoord0?: Attribute2, texCoord1?: Attribute2, color0?: Attribute3
    } = {}) {
        if (position) {
            this.position = position instanceof Vector3 ?
                position :
                new Vector3(position[0], position[1], position[2]);
        }
        if (normal) {
            this.normal = normal instanceof Vector3 ?
                normal :
                new Vector3(normal[0], normal[1], normal[2]);
        }
        if (tangent) {
            this.tangent = tangent instanceof Vector4 ?
                tangent :
                new Vector4(tangent[0], tangent[1], tangent[2], tangent[3]);
        }
        if (texCoord0) {
            this.texCoord0 = texCoord0 instanceof Vector2 ?
                texCoord0 :
                new Vector2(texCoord0[0], texCoord0[1]);
        }
        if (texCoord1) {
            this.texCoord1 = texCoord1 instanceof Vector2 ?
                texCoord1 :
                new Vector2(texCoord1[0], texCoord1[1]);
        }
        if (color0) {
            this.color0 = color0 instanceof Vector3 ?
                color0 :
                new Vector3(color0[0], color0[1], color0[2]);
        }
    }

    public static positionAttribute: VertexAttribute = new PositionAttribute();
    public static normalAttribute: VertexAttribute = new NormalAttribute();
    public static tangentAttribute: VertexAttribute = new TangentAttribute();
    public static texCoordAttribute: VertexAttribute[] = [
        new TexCoordAttribute(0),
        new TexCoordAttribute(1)
    ];
    public static colorAttribute: VertexAttribute = new ColorAttribute(0);
}
