/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export default function delay(milliseconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), milliseconds);
    });
}
