/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Alias type for value that can be null
 */
export type Nullable<T> = T | null;

/**
 * @hidden
 * Alias type for number that are floats
 * @ignorenaming
 */
export type float = number;

/**
 * @hidden
 * Alias type for number that are doubles.
 * @ignorenaming
 */
export type double = number;

/**
 * @hidden
 * Alias type for number that are integer
 * @ignorenaming
 */
export type int = number;

/**
 * @hidden
 * Alias type for number array or Float32Array
 */
export type FloatArray = number[] | Float32Array;

/**
 * @hidden
 * Alias type for number array or Float32Array or Int32Array or Uint32Array or Uint16Array
 */
export type IndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;

/**
 * @hidden
 * Alias for types that can be used by a Buffer or VertexBuffer.
 */
export type DataArray = number[] | ArrayBuffer | ArrayBufferView;
