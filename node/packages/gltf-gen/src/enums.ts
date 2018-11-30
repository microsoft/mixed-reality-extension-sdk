/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum TextureMagFilter {
    Nearest = 9728,
    Linear = 9729
}

export enum TextureMinFilter {
    Nearest = 9728,
    Linear = 9729,
    NearestMipmapNearest = 9984,
    LinearMipmapNearest = 9985,
    NearestMipmapLinear = 9986,
    LinearMipmapLinear = 9987
}

export enum TextureWrapMode {
    ClampToEdge = 33071,
    MirroredRepeat = 33648,
    Repeat = 10497
}

export enum AlphaMode {
    Opaque = 'OPAQUE',
    Mask = 'MASK',
    Blend = 'BLEND'
}

export enum AccessorComponentType {
    Byte = 5120,
    UByte = 5121,
    Short = 5122,
    UShort = 5123,
    UInt = 5125,
    Float = 5126
}

export enum AccessorType {
    Scalar = "SCALAR",
    Vec2 = "VEC2",
    Vec3 = "VEC3",
    Vec4 = "VEC4",
    Mat2 = "MAT2",
    Mat3 = "MAT3",
    Mat4 = "MAT4"
}
