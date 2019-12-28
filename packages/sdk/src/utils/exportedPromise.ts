/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/** @hidden */
export interface ExportedPromise {
	resolve: (...args: any[]) => void;
	reject: (reason?: any) => void;
	original?: Promise<any>;
}
