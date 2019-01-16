/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Verifies that `key` isn't an invalid key name. Useful for detecting when we're leaking private
 * fields into network payloads.
 */
export default function validateJsonFieldName(key: string) {
    // Uncomment to validate JSON payloads
    /*
    if (key.startsWith('_')) {
        throw new Error(`JSON contains invalid key name "${key}".`);
    }
    */
}
