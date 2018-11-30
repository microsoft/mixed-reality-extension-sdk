/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseLogger } from '.';
import { LogSeverity } from '../..';

/**
 * An implementation of `Logger` that outputs to the console.
 */
export class ConsoleLogger extends BaseLogger {
    /** @inheritdoc */
    public log(severity: LogSeverity, message?: any, ...optionalParams: any[]): void {
        if (this.isEnabled(severity)) {
            _log(severity, message, ...optionalParams);
        }
    }
}

// tslint:disable:max-classes-per-file new-parens no-console

const logMethods = new class {
    [key: string]: (message?: any, ...optionalParams: any[]) => void;
    public debug = console.debug;
    public info = console.info;
    public warning = console.warn;
    public error = console.error;
    public success = console.log;
};

const logTypes = new class {
    [key: string]: string;
    public debug = 'DBG';
    public info = 'INF';
    public warning = 'WRN';
    public error = 'ERR';
    public success = 'SIL';
};

function _log(sev: LogSeverity, message?: any, ...optionalParams: any[]) {
    const logMethod = logMethods[sev] || console.log;
    logMethod(`${logTypes[sev]}: ${message.toString()}`, ...optionalParams);
}
