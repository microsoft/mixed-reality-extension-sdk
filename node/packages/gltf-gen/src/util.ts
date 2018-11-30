/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export function roundUpToNextMultipleOf4(x: number): number {
    return Math.ceil(x / 4) * 4;
}
