/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import debug from 'debug';
// tslint:disable-next-line:no-var-requires
const pjson = require('../package.json');

class Log {
    private loggers: { [area: string]: debug.IDebugger } = {};

    private area(facility: string, severity: string): string {
        facility = this.cleanupFacility(facility);
        severity = this.cleanupSeverity(severity);
        let area = pjson.name;
        if (facility) {
            area = `${area}:${facility}`;
        }
        if (severity) {
            area = `${area}:${severity}`;
        }
        return area;
    }

    public enable(facility?: string, severity?: string) {
        const area = this.area(facility, severity);
        if (!this.loggers[area]) {
            this.loggers[area] = debug(area);
            const areas = Object.keys(this.loggers).join(',');
            debug.enable(areas);
        }
    }

    public disable(facility?: string, severity?: string) {
        delete this.loggers[this.area(facility, severity)];
        const areas = Object.keys(this.loggers).join(',');
        debug.enable(areas);
    }

    public enabled(facility?: string, severity?: string) {
        return !!this.loggers[this.area(facility, severity)];
    }

    private logger(facility: string, severity: string): debug.IDebugger {
        return this.loggers[this.area(facility, severity)];
    }

    public debug(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'debug', formatter, ...args);
    }

    public warning(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'warning', formatter, ...args);
    }

    public error(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'error', formatter, ...args);
    }

    public info(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'info', formatter, ...args);
    }

    public verbose(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'verbose', formatter, ...args);
    }

    public log(facility: string, severity: string, formatter: any, ...args: any[]) {
        facility = this.cleanupFacility(facility);
        severity = this.cleanupSeverity(severity);
        const logger = this.logger(null, null) || this.logger(facility, null) || this.logger(facility, severity);
        if (logger) {
            logger(formatter, ...args);
        }
    }

    private cleanupFacility(facility: string) {
        switch (facility) {
            case '': return null;
            default: return facility;
        }
    }

    private cleanupSeverity(severity: string) {
        switch (severity) {
            case 'success': return 'info';
            case '': return null;
            default: return severity;
        }
    }
}

export const log = new Log();

export function logIssueToApplication(severity: string, ...args: any[]) {
    if (severity === 'error' || severity === 'warning') {
        // tslint:disable-next-line:no-console
        console.log(severity, ...args);
    }
}
