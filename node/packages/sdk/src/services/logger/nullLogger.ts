/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseLogger } from '.';
import { LogSeverity } from '../..';

/**
 * A Logger that does not log anything.
 */
export class NullLogger extends BaseLogger {
    public log(severity: LogSeverity, message?: any, ...optionalParams: any[]): void {
    }
}
