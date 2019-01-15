/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Reads the value at the path in the src object and writes it to the dst object.
 */
export default function readPath(src: any, dst: any, ...path: string[]) {
    let field;
    while (path.length) {
        field = path.shift();
        if (path.length) {
            if (!dst.hasOwnProperty(field)) {
                dst[field] = {};
            }
            dst = dst[field];
        }
        src = src[field];
        if (src === undefined) {
            throw new Error("readPath: Data structure mismatch.");
        }
    }
    dst[field] = src;
}
