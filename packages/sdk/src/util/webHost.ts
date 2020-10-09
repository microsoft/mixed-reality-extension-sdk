/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Restify from 'restify';
import { NotFoundError } from 'restify-errors';
import etag from 'etag';

import { validate } from 'jsonschema';
import manifestSchema from './manifestSchema.json';
import { resolve } from 'path';
import { readFile as _readFile } from 'fs';
import { promisify } from 'util';
const readFile = promisify(_readFile);

import { log, MultipeerAdapter, Permissions } from '..';
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
	private manifest: Buffer = null;
	private _ready: Promise<void>;

	public get adapter() { return this._adapter; }
	public get baseDir() { return this._baseDir; }

	/**
	 * A promise that resolves when the HTTP server is listening.
	 * Get the server reference from `webHost.adapter.server`.
	 */
	public get ready() { return this._ready; }

	private bufferMap: { [path: string]: StaticBufferInfo } = {};

	public constructor(options: {
		baseDir?: string;
		baseUrl?: string;
		port?: string | number;
		permissions?: Permissions[];
		optionalPermissions?: Permissions[];
	} = {}) {
		const pjson = require('../../package.json'); /* eslint-disable-line @typescript-eslint/no-var-requires */
		log.info('app', `Node: ${process.version}`);
		log.info('app', `${pjson.name}: v${pjson.version}`);

		this._baseDir = options.baseDir || process.env.BASE_DIR;

		// Resolve the port number. Heroku defines a PORT environment var (remapped from 80).
		const port = options.port || process.env.PORT || 3901;

		// Create a Multi-peer adapter
		this._adapter = new MultipeerAdapter({ port });

		// Start listening for new app connections from a multi-peer client.
		const serverP = this.validateManifest().then(() => this._adapter.listen());
		this._ready = serverP.then<void>();
		serverP.then(server => {
			log.info('app', `${server.name} listening on ${JSON.stringify(server.address())}`);
			log.info('app', `baseDir: ${this.baseDir}`);

			// check if a procedural manifest is needed, and serve if so
			this.serveManifestIfNeeded(server, options.permissions, options.optionalPermissions);

			// serve static buffers
			server.get(`/buffers/:name`,
				this.checkStaticBuffers,
				Restify.plugins.conditionalRequest(),
				this.serveStaticBuffers);

			// serve static files
			if (this.baseDir) {
				server.get('/*', Restify.plugins.serveStaticFiles(this._baseDir));
			}
		})
		.catch(reason => log.error('app', `Failed to start HTTP server: ${reason}`));
	}

	private checkStaticBuffers = (req: Restify.Request, res: Restify.Response, next: Restify.Next) => {
		const info = this.bufferMap[req.params.name];
		if (info) {
			res.setHeader('ETag', info.etag);
			next();
		} else {
			next(new NotFoundError(`No buffer registered under name ${req.params.name}`));
		}
	};

	private serveStaticBuffers = (req: Restify.Request, res: Restify.Response, next: Restify.Next) => {
		const info = this.bufferMap[req.params.name];
		if (info) {
			res.contentType = info.contentType;
			res.sendRaw(200, info.buffer);
			next();
		} else {
			next(new NotFoundError(`No buffer registered under name ${req.params.name}`));
		}
	};

	private async validateManifest() {
		const manifestPath = resolve(this.baseDir, './manifest.json');

		try {
			this.manifest = await readFile(manifestPath);
		} catch {
			return;
		}

		let manifestJson: any;
		try {
			manifestJson = JSON.parse(this.manifest.toString('utf8'));
		} catch {
			log.error('app', `App manifest "${manifestPath}" is not JSON`);
			this.manifest = null;
			return;
		}

		const result = validate(manifestJson, manifestSchema);
		if (!result.valid) {
			log.error('app', `App manifest "${manifestPath}" is not valid:\n${result.errors.join('\n')}`);
			this.manifest = null;
			return;
		}
	}

	private serveManifestIfNeeded(
		server: Restify.Server, permissions?: Permissions[], optionalPermissions?: Permissions[]
	) {
		// print warning if no manifest supplied
		if (!this.manifest && !permissions && !optionalPermissions) {
			log.warning('app',
				"No MRE manifest provided, and no permissions requested! For this MRE to use protected features, " +
				`provide an MRE manifest at "${resolve(this.baseDir, './manifest.json')}", or pass a permissions ` +
				"list into the WebHost constructor.");
		}

		server.get('/manifest.json', (_, res, next) => {
			if (this.manifest) {
				res.sendRaw(200, this.manifest, { "Content-Type": "application/json" });
			} else if (permissions || optionalPermissions) {
				res.json(200, { permissions, optionalPermissions });
			} else {
				res.send(404);
			}
			next();
		});
	}

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
		return `buffers/${filename}`;
	}
}
