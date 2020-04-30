/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { resolve as urlResolve } from 'url';
import * as Restify from 'restify';
import etag from 'etag';

import { log, MultipeerAdapter } from '..';
import { Adapter } from '../internal';

type StaticBufferInfo = {
	buffer: Buffer;
	etag: string;
	contentType: string;
};

/**
 * Sets up an HTTP server, and generates an MRE context for your app to use.
 */
export class WebHost {
	private _adapter: Adapter;
	private _baseDir: string;
	private _baseUrl: string;

	public get adapter() { return this._adapter; }
	public get baseDir() { return this._baseDir; }
	public get baseUrl() { return this._baseUrl; }

	private bufferMap: { [path: string]: StaticBufferInfo } = {};

	public constructor(options: {
		baseDir?: string;
		baseUrl?: string;
		port?: string | number;
	} = {}) {
		const pjson = require('../../package.json'); /* eslint-disable-line @typescript-eslint/no-var-requires */
		log.info('app', `Node: ${process.version}`);
		log.info('app', `${pjson.name}: v${pjson.version}`);

		this._baseDir = options.baseDir || process.env.BASE_DIR;
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
				this._baseUrl = this._baseUrl || server.url.replace(/\[::\]/u, '127.0.0.1');
				log.info('app', `${server.name} listening on ${JSON.stringify(server.address())}`);
				log.info('app', `baseUrl: ${this.baseUrl}`);
				log.info('app', `baseDir: ${this.baseDir}`);
				if (this.baseDir) {
					this.serveStaticFiles(server);
				}
			})
			.catch(reason => log.error('app', `Failed to start HTTP server: ${reason}`));
	}

	private serveStaticFiles(server: Restify.Server) {
		server.get(`/buffers/:name`,
			this.checkStaticBuffers,
			Restify.plugins.conditionalRequest(),
			this.serveStaticBuffers);
		server.get('/*', Restify.plugins.serveStaticFiles(this._baseDir));
	}

	private checkStaticBuffers = (req: Restify.Request, res: Restify.Response, next: Restify.Next) => {
		const info = this.bufferMap[req.params.name];
		if (info) {
			res.setHeader('ETag', info.etag);
			next();
		} else {
			next(new Error(`No buffer registered under name ${req.params.name}`));
		}
	};

	private serveStaticBuffers = (req: Restify.Request, res: Restify.Response, next: Restify.Next) => {
		const info = this.bufferMap[req.params.name];
		if (info) {
			res.contentType = info.contentType;
			res.sendRaw(200, info.buffer);
			next();
		} else {
			next(new Error(`No buffer registered under name ${req.params.name}`));
		}
	};

	/**
	 * Serve arbitrary binary blobs from a URL
	 * @param filename A unique string ID for the blob
	 * @param blob A binary blob
	 * @param contentType The MIME type that identifies this blob
	 * @returns The URL to fetch the provided blob
	 */
	public registerStaticBuffer(filename: string, blob: Buffer, contentType = 'application/octet-stream'): string {
		this.bufferMap[filename] = {
			buffer: blob,
			etag: etag(blob),
			contentType
		};
		return urlResolve(this._baseUrl, `buffers/${filename}`);
	}
}
