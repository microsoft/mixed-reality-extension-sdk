/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import debug from 'debug';

class Log {

    private loggers: { [area: string]: debug.IDebugger } = {};

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
        this.checkInitialize();
        if (formatter) {
            facility = this.cleanupFacility(facility);
            severity = this.cleanupSeverity(severity);
            const logger = this.logger(null, null) || this.logger(facility, null) || this.logger(facility, severity);
            if (logger) {
                logger(formatter, ...args);
            }
        }
    }

    private area(facility: string, severity: string): string {
        facility = this.cleanupFacility(facility);
        severity = this.cleanupSeverity(severity);
        let area = '';
        if (facility) {
            area = `${facility}`;
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

    private checkInitialize = () => {
        this.enable('app');
        const logging = process.env.MRE_LOGGING || '';
        if (logging && logging.length) {
            const parts = logging.split(',').map(s => s.trim());
            for (const part of parts) {
                let [facility, severity] = part.split(':').map(s => s.trim());
                const disable = facility.startsWith('-');
                facility = facility.replace(/^-/, '');
                severity = severity; // tslint
                if (disable) {
                    this.disable(facility, severity);
                } else {
                    this.enable(facility, severity);
                }
            }
        }
        this.checkInitialize = () => { };
    }
}

export const log = new Log();
