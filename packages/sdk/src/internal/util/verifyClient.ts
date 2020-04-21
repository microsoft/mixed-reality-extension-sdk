/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import semver from 'semver';
import { Constants } from '../../internal';
import { log } from '../..';

/*
 * Current SDK Version - Read from package.json.
 */
const CurrentSDKVersion = semver.coerce(require('../../../package.json').version);

/*
 * Minimum Supported Client Library version
 * As part of the manual SDK release procedures, this is reset to match CurrentSDKVersion Major.Minor if new functions
 * have been added that don't work on older clients (i.e. pretty much every release). Since host apps are required to
 * update client libraries regularly, this one is not a big deal to update.
 */
const MinimumSupportedClientVersion = semver.coerce('0.17');

/**
 * @hidden
 * 'ws' middleware to validate the client protocol version when processing a connection upgrade request.
 * @param info 'ws' request information
 * @param cb 'ws' verification callback
 */
export function verifyClient(
	info: any, cb: (verified: boolean, code?: number, message?: string) => any): any {
	// Look for the upgrade request.
	const req = info.req || {};

	// Look for the request headers.
	const headers = req.headers || [];

	// Verify minimum supported versions are met (client and SDK).

	/*
	 * Due to a shortcoming in C# ClientWebSocket, we have no way to convey any error details in the HTTP response,
	 * including error code.
	 *    See: "ClientWebSocket does not provide upgrade request error details"
	 *    https://github.com/dotnet/corefx/issues/29163
	 */

	const CurrentClientVersion
		= semver.coerce(decodeURIComponent(headers[Constants.HTTPHeaders.CurrentClientVersion]));
	const MinimumSupportedSDKVersion
		= semver.coerce(decodeURIComponent(headers[Constants.HTTPHeaders.MinimumSupportedSDKVersion]));

	if (CurrentClientVersion && MinimumSupportedSDKVersion) {
		// Test the current client version. Is it greater than or equal to the minimum client version?
		const clientPass = semver.gte(CurrentClientVersion, MinimumSupportedClientVersion);
		// Test the current SDK version. Is it greater than or equal to the minimum SDK version?
		const sdkPass = semver.gte(CurrentSDKVersion, MinimumSupportedSDKVersion);

		if (!clientPass) {
			const message = `Connection rejected due to out of date client. ` +
				`Client version: ${CurrentClientVersion.toString()}. ` +
				`Min supported version by SDK: ${MinimumSupportedClientVersion.toString()}`;
			log.info('app', message);
			return cb(false, 403, message);
		}

		if (!sdkPass) {
			const message = `Connection rejected due to out of date SDK. ` +
				`Current SDK version: ${CurrentSDKVersion.toString()}. ` +
				`Min supported version by client: ${MinimumSupportedSDKVersion.toString()}`;
			log.info('app', message);
			// Log this line to the console. The developer should know about this.
			// eslint-disable-next-line no-console
			console.info(message);
			return cb(false, 403, message);
		}

		// Client and SDK are compatible.
		return cb(true);
	}

	// Temporary: Support old clients reporting the legacy protocol version.
	// TODO: Remove this after a few releases.
	const legacyProtocolVersion = decodeURIComponent(headers[Constants.HTTPHeaders.LegacyProtocolVersion]);
	if (legacyProtocolVersion === '1') {
		return cb(true);
	}

	return cb(false, 403, "Version headers missing.");
}
