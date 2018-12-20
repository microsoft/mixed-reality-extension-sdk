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

    private binaryMap: { [path: string]: ArrayBuffer } = {};

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
            .catch(reason => log.error(null, `Failed to start HTTP server: ${reason}`));
    }

    private serveStaticFiles(server: Restify.Server) {
        server.get('/*',
            // host static binaries
            (req, res, next) => this.serveStaticBinaries(req, res, next),
            // host static files
            Restify.plugins.serveStatic({
                directory: this._baseDir,
                default: 'index.html'
            }
            ));
    }

    private proceduralRegex = new RegExp(`^${this._baseUrl}/procedural/(.+)$`);

    private serveStaticBinaries(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
        // grab path part of URL
        const matches = this.proceduralRegex.exec(req.url);
        const procPath = matches && matches[1] || null;

        // see if there's a handler registered for it
        if (!procPath || !this.binaryMap[procPath]) {
            return next();
        }

        // if so, serve binary
        res.sendRaw(200, this.binaryMap[procPath]);
    }

    /**
     * Serve arbitrary binary blobs from a URL
     * @param filename A unique string ID for the blob
     * @param blob A binary blob
     * @returns The URL to fetch the provided blob
     */
    public registerStaticProcedural(filename: string, blob: ArrayBuffer): string {
        this.binaryMap[filename] = blob;
        return `${this._baseUrl}/procedural/${filename}`;
    }
}
