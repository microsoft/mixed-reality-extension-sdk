/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import validateJsonFieldName from "./validateJsonFieldName";

/**
 * @hidden
 * Reads the value at the path in the src object and writes it to the dst object.
 */
export default function readPath(src: any, dst: any, ...path: string[]) {
    let field;
    while (path.length) {
        field = path.shift();
        validateJsonFieldName(field);
        if (path.length) {
            if (!dst.hasOwnProperty(field)) {
                dst[field] = {};
            }
            dst = dst[field];
        }
        if (typeof src[field] === undefined) {
            throw new Error("readPath: Data structure mismatch.");
        }
        src = src[field];
    }
    dst[field] = src;
}
