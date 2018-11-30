/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OperationResultCode, TraceSeverity } from '../..';

/**
 * A union of OperationResultCode and TraceSeverity that describes the different severity levels that can be specified
 * when logging messages to a Logger.
 */
export type LogSeverity = OperationResultCode | TraceSeverity;

/**
 * A Logger is a facility for writing out text messages.
 */
export interface Logger {
    enable(...severities: LogSeverity[]): void;
    disable(...severities: LogSeverity[]): void;
    isEnabled(severity: LogSeverity): boolean;
    log(severity: LogSeverity, message?: any, ...optionalParams: any[]): void;
}

/**
 * Abstract base class containing elements common to different concrete Logger implementations.
 */
export abstract class BaseLogger implements Logger {
    private disabled: LogSeverity[] = [];
    public enable(...severities: LogSeverity[]): void {
        for (const severity of severities) {
            if (!this.isEnabled(severity)) {
                this.disabled = this.disabled.filter(value => value !== severity);
            }
        }
    }
    public disable(...severities: LogSeverity[]) {
        for (const severity of severities) {
            if (this.isEnabled(severity)) {
                this.disabled.push(severity);
            }
        }
    }
    public isEnabled(severity: LogSeverity): boolean {
        return this.disabled.findIndex(item => item === severity) === -1;
    }
    public abstract log(severity: LogSeverity, message?: any, ...optionalParams: any[]): void;
}
