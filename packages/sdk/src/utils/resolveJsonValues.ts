/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

 /**
  * @hidden
  * Recursively look for values with a `toJSON()` method. If found,
  * call it and replace the value with the return value.
  */
export default function resolveJsonValues(obj: any) {
    if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        for (const key of keys) {
            resolveJsonValues(obj[key]);
            const value = obj[key];
            if (!!value && typeof value.toJSON === "function") {
                obj[key] = value.toJSON();
            }
        }
    }
    return obj;
}
