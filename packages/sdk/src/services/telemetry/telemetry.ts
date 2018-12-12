/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface Telemetry {
    trackEvent(event: string, ...args: any[]): void;
    trackTrace(trace: string, ...args: any[]): void;
    trackMetric(metric: string, ...args: any[]): void;
    trackException(e: Error): void;
}
