/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/* eslint-disable max-classes-per-file */

/** Thrown when a function's preconditions are not met. An argument may be null, or of the wrong type/structure. */
export class MreValidationError extends Error {
	constructor(...args: any[]) { super(...args); }
}

