/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export default function safeAccessPath(obj: any, ...path: any[]): any {
    for (let i = 0; i < path.length; i++) {
        if (!obj[path[i]]) {
            return undefined;
        } else {
            obj = obj[path[i]];
        }
    }
    return obj;
}