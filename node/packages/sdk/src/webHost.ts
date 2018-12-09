/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Restify from 'restify';
import { Adapter, MultipeerAdapter } from '.';
import { log } from './log';

/**
 * Sets up an HTTP server, and generates an MRE context for your app to use.
 */
export class WebHost {
    // tslint:disable:variable-name
    private _adapter: Adapter;
    private _baseDir: string;
    private _baseUrl: string;
    // tslint:enable:variable-name

    public get adapter() { return this._adapter; }
    public get baseDir() { return this._baseDir; }
    public get baseUrl() { return this._baseUrl; }

    public constructor(
        options: { baseDir?: string, baseUrl?: string, port?: string | number }
            = { baseDir: '.', baseUrl: null, port: null }
    ) {
        this._baseDir = options.baseDir;
        this._baseUrl = options.baseUrl;

        const port = options.port || process.env.PORT || 3901;

        // Create a Multi-peer adapter
        this._adapter = new MultipeerAdapter({ port });

        // Start listening for new app connections from a multi-peer client
        this._adapter.listen()
            .then(server => {
                log.logToApp(`${server.name} listening on ${JSON.stringify(server.address())}`);
                this.serveStaticFiles(server);
            })
            .catch(reason => log.error(null, `Failed to start HTTP server: ${reason}`));
    }

    private serveStaticFiles(server: Restify.Server): void {
        // The static files location
        if (!this._baseUrl) {
            this._baseUrl =
                process.env.BASE_URL || (
                    process.env.WEBSITE_HOSTNAME ?
                        `https://${process.env.WEBSITE_HOSTNAME}` :
                        server.url.replace(/\[::\]/, '127.0.0.1')
                );
        }
        log.logToApp(`baseUrl: ${this.baseUrl}`);
        log.logToApp(`baseDir: ${this.baseDir}`);

        // Setup static files route
        server.get('/*', Restify.plugins.serveStatic({
            directory: this._baseDir,
            default: 'index.html'
        }));
    }
}
