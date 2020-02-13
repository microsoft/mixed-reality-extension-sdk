/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Defines different log severity levels.
 */
export type TraceSeverity = 'debug' | 'info' | 'warning' | 'error';

/**
 * @hidden
 */
export interface Trace {
	severity: TraceSeverity;
	message: string;
}
