/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import debug from 'debug';
// tslint:disable-next-line:no-var-requires
const pjson = require('../package.json');

const kApp = 'app';

class Log {

    private loggers: { [area: string]: debug.IDebugger } = {};

    constructor() {
        this.enableArea(kApp);
    }

    public get logToAppEnabled() {
        return !!this.loggers[kApp];
    }
    public set logToAppEnabled(enable: boolean) {
        if (enable) {
            this.enableArea(kApp);
        } else {
            this.disableArea(kApp);
        }
    }

    public enable(facility?: string, severity?: string) {
        const area = this.area(facility, severity);
        this.enableArea(area);
    }

    public disable(facility?: string, severity?: string) {
        const area = this.area(facility, severity);
        this.disableArea(area);
    }

    public enabled(facility?: string, severity?: string) {
        const area = this.area(facility, severity);
        return this.areaEnabled(area);
    }

    private logger(facility: string, severity: string): debug.IDebugger {
        return this.loggers[this.area(facility, severity)];
    }

    public debug(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'debug', formatter, ...args);
    }

    public warning(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'warning', formatter, ...args);
        if (!this.enabled(facility, 'warning')) {
            this.logToApp(formatter, ...args);
        }
    }

    public error(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'error', formatter, ...args);
        if (!this.enabled(facility, 'error')) {
            this.logToApp(formatter, ...args);
        }
    }

    public info(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'info', formatter, ...args);
    }

    public verbose(facility: string, formatter: any, ...args: any[]) {
        this.log(facility, 'verbose', formatter, ...args);
    }

    public log(facility: string, severity: string, formatter: any, ...args: any[]) {
        if (formatter) {
            facility = this.cleanupFacility(facility);
            severity = this.cleanupSeverity(severity);
            const logger = this.logger(null, null) || this.logger(facility, null) || this.logger(facility, severity);
            if (logger) {
                logger(formatter, ...args);
            }
        }
    }

    public logToApp(formatter: any, ...args: any[]) {
        const logger = this.loggers[kApp];
        if (logger) {
            logger(formatter, ...args);
        }
    }

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

    private enableArea(area: string) {
        if (!this.loggers[area]) {
            this.loggers[area] = debug(area);
            const areas = Object.keys(this.loggers).join(',');
            debug.enable(areas);
        }
    }

    private disableArea(area: string) {
        delete this.loggers[area];
        const areas = Object.keys(this.loggers).join(',');
        debug.enable(areas);
    }

    private areaEnabled(area: string) {
        return !!this.loggers[area];
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
