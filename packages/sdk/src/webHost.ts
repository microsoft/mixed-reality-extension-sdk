/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { resolve as resolvePath } from 'path';
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
        options: { baseDir?: string, baseUrl?: string, port?: string | number } = {}
    ) {
        this._baseDir = options.baseDir || process.env.BASE_DIR || resolvePath('./public');
        this._baseUrl = options.baseUrl || process.env.BASE_URL;

        // Azure defines WEBSITE_HOSTNAME.
        if (!this._baseUrl && process.env.WEBSITE_HOSTNAME) {
            this._baseUrl = `https://${process.env.WEBSITE_HOSTNAME}`;
        }

        // Resolve the port number. Heroku defines a PORT environment var (remapped from 80).
        const port = options.port || process.env.PORT || 3901;

        // Create a Multi-peer adapter
        this._adapter = new MultipeerAdapter({ port });

        // Start listening for new app connections from a multi-peer client.
        this._adapter.listen()
            .then(server => {
                this._baseUrl = this._baseUrl || server.url.replace(/\[::\]/, '127.0.0.1');
                log.logToApp(`${server.name} listening on ${JSON.stringify(server.address())}`);
                log.logToApp(`baseUrl: ${this.baseUrl}`);
                log.logToApp(`baseDir: ${this.baseDir}`);
                this.serveStaticFiles(server);
            })
            .catch(reason => log.error('app', `Failed to start HTTP server: ${reason}`));
    }

    private serveStaticFiles(server: Restify.Server) {
        // Setup static files route
        server.get('/*', Restify.plugins.serveStatic({
            directory: this._baseDir,
            default: 'index.html'
        }));
    }
}
