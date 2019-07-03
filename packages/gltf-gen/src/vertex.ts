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

export interface VertexLike {
	position?: Attribute3,
	normal?: Attribute3,
	tangent?: Attribute4,
	texCoord0?: Attribute2,
	texCoord1?: Attribute2,
	color0?: Attribute3
}

export class Vertex implements VertexLike {
	public position: Vector3;
	public normal: Vector3;
	public tangent: Vector4;
	public texCoord0: Vector2;
	public texCoord1: Vector2;
	public color0: Vector3;

	constructor(init: VertexLike = {}) {
		if (init.position) {
			this.position = init.position instanceof Vector3 ?
				init.position :
				new Vector3(init.position[0], init.position[1], init.position[2]);
		}
		if (init.normal) {
			this.normal = init.normal instanceof Vector3 ?
				init.normal :
				new Vector3(init.normal[0], init.normal[1], init.normal[2]);
		}
		if (init.tangent) {
			this.tangent = init.tangent instanceof Vector4 ?
				init.tangent :
				new Vector4(init.tangent[0], init.tangent[1], init.tangent[2], init.tangent[3]);
		}
		if (init.texCoord0) {
			this.texCoord0 = init.texCoord0 instanceof Vector2 ?
				init.texCoord0 :
				new Vector2(init.texCoord0[0], init.texCoord0[1]);
		}
		if (init.texCoord1) {
			this.texCoord1 = init.texCoord1 instanceof Vector2 ?
				init.texCoord1 :
				new Vector2(init.texCoord1[0], init.texCoord1[1]);
		}
		if (init.color0) {
			this.color0 = init.color0 instanceof Vector3 ?
				init.color0 :
				new Vector3(init.color0[0], init.color0[1], init.color0[2]);
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
