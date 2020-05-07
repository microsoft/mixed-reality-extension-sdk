/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Restify from 'restify';
import { Stats } from 'fs';

// TODO: File a pull request adding this to @types/restify
declare module "restify" {
	namespace plugins {
		interface ServeStaticFilesOptions {
			maxAge?: number;
			etag?: boolean;
			setHeaders?: (res: Restify.Response, path: string, stat: Stats) => void;
			index?: string[] | string | boolean;
			acceptRanges?: boolean;
		}

		function serveStaticFiles(directory: string, opts?: ServeStaticFilesOptions): Restify.RequestHandler;
	}
}
