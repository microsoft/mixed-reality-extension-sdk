/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Connection, Logger, Storage, Telemetry } from '.';

export interface Services {
    readonly sessionId?: string;
    readonly storage?: Storage;
    readonly conn?: Connection;
    readonly logger?: Logger;
    readonly telemetry?: Telemetry;
}
