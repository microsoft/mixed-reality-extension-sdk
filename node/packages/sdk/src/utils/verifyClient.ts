/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Constants from '../constants';

/*
 * Supported protocol version
 * **WARNING**: Incrementing this value will break older clients. Strive to be backward compatible. Change this value
 * only after discussing with the team and considering every alternative.
 */
// tslint:disable-next-line:variable-name
const CurrentProtocolVersion = 1;

/**
 * @hidden
 * 'ws' middleware to validate the client protocol version when processing a connection upgrade request.
 * @param info 'ws' request information
 * @param cb 'ws' verification callback
 */
export function verifyClient(
    info: any, cb: (verified: boolean, code?: number, message?: string) => any): any {
    const makeResponse = (code: string, message: string): string => {
        const error = { code, message };
        return JSON.stringify(error, null, 0);
    };

    // Look for the upgrade request.
    const req = info.req || {};

    // Look for the request headers.
    const headers = req.headers || [];

    // Look for the protocol version header.
    const protocolVersion = decodeURIComponent(headers[Constants.ProtocolVersionHeader]);

    // Check protocol version.
    if (!isSupportedProtocolVersion(protocolVersion)) {
        return cb(false, 403,
            makeResponse(
                'ERR_UNSUPPORTED_PROTOCOL_VERSION', "Unsupported protocol version"));
    }

    // Client looks valid to connect.
    return cb(true);
}

/**
 * @hidden
 * Utility that checks the given protocol version against the supported version.
 * @param protocolVersion The protocol version to check.
 * @returns `true` if this is a supported protocol version. `false` otherwise.
 */
export function isSupportedProtocolVersion(protocolVersion: number | string | null | undefined): boolean {
    if (typeof protocolVersion === 'string') {
        protocolVersion = Number.parseInt(protocolVersion, 10);
    }
    if (protocolVersion == null || Number.isNaN(protocolVersion)) {
        return false;
    }
    // For now, just check for equality. This will become more nuanced over time.
    return CurrentProtocolVersion === protocolVersion;
}
