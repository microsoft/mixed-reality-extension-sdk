/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector2, Vector3, Vector4 } from '@microsoft/mixed-reality-extension-sdk';
import { AccessorComponentType, AccessorType } from './enums';
import { Vertex } from './vertex';

// tslint:disable:max-classes-per-file

export abstract class VertexAttribute {
    public componentType: AccessorComponentType = AccessorComponentType.Float;
    public multiType: AccessorType = AccessorType.Scalar;
    public abstract get attributeName(): string;

    // tslint:disable:variable-name
    protected _min: Vector2 | Vector3 | Vector4;
    protected _max: Vector2 | Vector3 | Vector4;
    // tslint:enable:variable-name
    public get min(): Vector2 | Vector3 | Vector4 { return this._min; }
    public get max(): Vector2 | Vector3 | Vector4 { return this._max; }

    constructor(c: AccessorComponentType, m: AccessorType) {
        this.componentType = c;
        this.multiType = m;
    }

    public abstract writeToBuffer(v: Vertex, buffer: Buffer, offset: number): void;
    public abstract resetMinMax(): void;

    private compSize = -1;
    public get elementByteSize(): number {
        if (this.compSize >= 0) {
            return this.compSize;
        } else {
            return this.compSize = VertexAttribute._sizeof(this.componentType);
        }
    }

    private fullSize = -1;
    public get byteSize(): number {
        if (this.fullSize >= 0) {
            return this.fullSize;
        } else {
            return this.fullSize = VertexAttribute._sizeof(this.componentType, this.multiType);
        }
    }

    private static _sizeof(compType: AccessorComponentType, type: AccessorType = AccessorType.Scalar): number {
        let compSize: number;
        switch (compType) {
            case AccessorComponentType.Byte:
            case AccessorComponentType.UByte:
                compSize = 1;
                break;
            case AccessorComponentType.Short:
            case AccessorComponentType.UShort:
                compSize = 2;
                break;
            case AccessorComponentType.UInt:
            case AccessorComponentType.Float:
                compSize = 4;
                break;
            default:
                compSize = 1;
        }

        let count: number;
        switch (type) {
            case AccessorType.Scalar: count = 1; break;
            case AccessorType.Vec2: count = 2; break;
            case AccessorType.Vec3: count = 3; break;
            case AccessorType.Vec4: count = 4; break;
            case AccessorType.Mat2: count = 4; break;
            case AccessorType.Mat3: count = 9; break;
            case AccessorType.Mat4: count = 16; break;
            default: count = 1;
        }

        return compSize * count;
    }
}

export class PositionAttribute extends VertexAttribute {
    // tslint:disable:variable-name
    protected _min: Vector3;
    protected _max: Vector3;
    // tslint:enable:variable-name
    public get min(): Vector3 { return this._min; }
    public get max(): Vector3 { return this._max; }

    public get attributeName(): string { return 'POSITION'; }

    constructor() {
        super(AccessorComponentType.Float, AccessorType.Vec3);
        this.resetMinMax();
    }

    public resetMinMax(): void {
        this._min = new Vector3(Infinity, Infinity, Infinity);
        this._max = new Vector3(-Infinity, -Infinity, -Infinity);
    }

    public writeToBuffer(v: Vertex, buffer: Buffer, offset: number): void {

        buffer.writeFloatLE(v.position.x, offset + 0 * this.elementByteSize);
        buffer.writeFloatLE(v.position.y, offset + 1 * this.elementByteSize);
        buffer.writeFloatLE(v.position.z, offset + 2 * this.elementByteSize);

        this._min.minimizeInPlace(v.position);
        this._max.maximizeInPlace(v.position);
    }
}

export class NormalAttribute extends VertexAttribute {
    // tslint:disable:variable-name
    protected _min: Vector3;
    protected _max: Vector3;
    // tslint:enable:variable-name
    public get min(): Vector3 { return this._min; }
    public get max(): Vector3 { return this._max; }

    public get attributeName(): string { return 'NORMAL'; }

    constructor() {
        super(AccessorComponentType.Float, AccessorType.Vec3);
        this.resetMinMax();
    }

    public resetMinMax(): void {
        this._min = new Vector3(Infinity, Infinity, Infinity);
        this._max = new Vector3(-Infinity, -Infinity, -Infinity);
    }

    public writeToBuffer(v: Vertex, buffer: Buffer, offset: number): void {

        buffer.writeFloatLE(v.normal.x, offset + 0 * this.elementByteSize);
        buffer.writeFloatLE(v.normal.y, offset + 1 * this.elementByteSize);
        buffer.writeFloatLE(v.normal.z, offset + 2 * this.elementByteSize);

        this._min.minimizeInPlace(v.normal);
        this._max.maximizeInPlace(v.normal);
    }
}

export class TangentAttribute extends VertexAttribute {
    // tslint:disable:variable-name
    protected _min: Vector4;
    protected _max: Vector4;
    // tslint:enable:variable-name
    public get min(): Vector4 { return this._min; }
    public get max(): Vector4 { return this._max; }

    public get attributeName(): string { return 'TANGENT'; }

    constructor() {
        super(AccessorComponentType.Float, AccessorType.Vec4);
        this.resetMinMax();
    }

    public resetMinMax(): void {
        this._min = new Vector4(Infinity, Infinity, Infinity, Infinity);
        this._max = new Vector4(-Infinity, -Infinity, -Infinity, -Infinity);
    }

    public writeToBuffer(v: Vertex, buffer: Buffer, offset: number): void {

        buffer.writeFloatLE(v.tangent.x, offset + 0 * this.elementByteSize);
        buffer.writeFloatLE(v.tangent.y, offset + 1 * this.elementByteSize);
        buffer.writeFloatLE(v.tangent.z, offset + 2 * this.elementByteSize);
        buffer.writeFloatLE(v.tangent.w, offset + 3 * this.elementByteSize);

        this._min.minimizeInPlace(v.tangent);
        this._max.maximizeInPlace(v.tangent);
    }
}

export class TexCoordAttribute extends VertexAttribute {
    private index: number;
    // tslint:disable:variable-name
    protected _min: Vector2;
    protected _max: Vector2;
    // tslint:enable:variable-name
    public get min(): Vector2 { return this._min; }
    public get max(): Vector2 { return this._max; }

    public get attributeName(): string { return 'TEXCOORD_' + this.index; }

    constructor(index: number) {
        super(AccessorComponentType.Float, AccessorType.Vec2);
        this.index = index;
        this.resetMinMax();
    }

    public resetMinMax(): void {
        this._min = new Vector2(Infinity, Infinity);
        this._max = new Vector2(-Infinity, -Infinity);
    }

    public writeToBuffer(v: Vertex, buffer: Buffer, offset: number): void {
        const vec = this.index === 1 ? v.texCoord1 : v.texCoord0;

        buffer.writeFloatLE(vec.x, offset + 0 * this.elementByteSize);
        buffer.writeFloatLE(vec.y, offset + 1 * this.elementByteSize);

        this._min = Vector2.Minimize(this._min, vec);
        this._max = Vector2.Maximize(this._max, vec);
    }
}

export class ColorAttribute extends VertexAttribute {
    private index: number;
    // tslint:disable:variable-name
    protected _min: Vector3;
    protected _max: Vector3;
    // tslint:enable:variable-name
    public get min(): Vector3 { return this._min; }
    public get max(): Vector3 { return this._max; }

    public get attributeName(): string { return 'COLOR_' + this.index; }

    constructor(index: number) {
        super(AccessorComponentType.UByte, AccessorType.Vec3);
        this.index = index;
        this.resetMinMax();
    }

    public resetMinMax(): void {
        this._min = new Vector3(Infinity, Infinity, Infinity);
        this._max = new Vector3(-Infinity, -Infinity, -Infinity);
    }

    public writeToBuffer(v: Vertex, buffer: Buffer, offset: number): void {

        buffer.writeUInt8(Math.floor(v.color0.x * 255), offset + 0 * this.elementByteSize);
        buffer.writeUInt8(Math.floor(v.color0.y * 255), offset + 1 * this.elementByteSize);
        buffer.writeUInt8(Math.floor(v.color0.z * 255), offset + 2 * this.elementByteSize);

        this._min.minimizeInPlace(v.position);
        this._max.maximizeInPlace(v.position);
    }
}
