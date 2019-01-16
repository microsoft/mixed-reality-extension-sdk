/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * If `obj` is an empty object, return undefined.
 */
export default function filterEmpty(obj: any) {
    if (typeof obj !== "object" || Object.keys(obj).length) {
        return obj;
    }
}
