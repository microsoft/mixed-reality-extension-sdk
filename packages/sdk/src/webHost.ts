/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as http from 'http';
import QueryString from 'query-string';
import * as Restify from 'restify';
import { resolve as urlResolve } from 'url';
import * as WS from 'ws';
import { Adapter, MultipeerAdapter } from './adapters';
import { log } from './log';
import verifyClient from './utils/verifyClient';

export type WebSocketUpgradeRequestHandler = (ws: WS, request: http.IncomingMessage) => void;
export type WebSocketRoute = string | RegExp;

const BUFFER_KEYWORD = 'buffers';
const BUFFER_REGEX = new RegExp(`^/${BUFFER_KEYWORD}/(.+)$`, 'u');

/**
 * Configuration options for a WebHost instance.
 */
export type WebHostOptions = {
	/**
	 * @member baseDir (Optional) The local folder where this app is running. Will attempt to read from BASE_DIR
	 * environment variable.
	 */
	baseDir?: string;
	/**
	 * @member baseUrl (Optional) The public URL where this app is running. Will attempt to read from BASE_URL
	 * environment variable. Will default to the IP address of the bound listening socket.
	 */
	baseUrl?: string;
	/**
	 * @member port (Optional) When options.server is not supplied and an internal web server is to be
	 * created, this is the port number it should listen on. If this value is not given, it will attempt to read the
	 * PORT environment variable, then default to 3901.
	 */
	port?: string | number;
	/**
	 * @member mreRoute (Optional) The URL path segment where your MRE is mounted to the WebSocket. Default
	 * is the root (no path segment. Example: "/mre". Use this when you wish to mount additional WebSocket endpoints.
	 * Default is "/".
	 */
	mreRoute?: string;
	/**
	 * @member adapter (Optional) MRE Adapter to register. Default is `MultpeerAdapter`. Pass `null` if you don't want
	 * an adapter to be created.
	 */
	adapter?: Adapter;
};

/**
 * Sets up an HTTP server, and generates an MRE context for your app to use.
 */
export class WebHost {
	private _server: Restify.Server;
	private wss: WS.Server;
	private bufferMap: { [path: string]: Buffer } = {};
	private webSocketRouteMap = new Map<WebSocketRoute, WebSocketUpgradeRequestHandler>();

	public get server() { return this._server; }
	public get adapter() { return this.options.adapter; }
	public get baseDir() { return this.options.baseDir; }
	public get baseUrl() { return this.options.baseUrl; }

	public constructor(private options?: WebHostOptions) {
		const pjson = require('../package.json'); /* eslint-disable-line @typescript-eslint/no-var-requires */
		log.info('app', `Node: ${process.version}`);
		log.info('app', `${pjson.name}: v${pjson.version}`);

		this.options = {
			baseDir: process.env.BASE_DIR,
			baseUrl: process.env.BASE_URL,
			port: process.env.PORT || process.env.port || 3901,
			mreRoute: '/',
			...this.options
		};

		// Azure defines WEBSITE_HOSTNAME
		if (!this.options.baseUrl && process.env.WEBSITE_HOSTNAME) {
			this.options.baseUrl = `https://${process.env.WEBSITE_HOSTNAME}`;
		}

		// Set the default adapter only if `adapter` was entirely omitted from `options`.
		// If the caller passed `null` interpret this as "I don't want an adapter added".
		if (this.options.adapter === undefined) {
			this.options.adapter = new MultipeerAdapter();
		}

		// If an adapter was provided, register it.
		if (this.options.adapter) {
			this.addAdapter(this.options.mreRoute, this.adapter);
		}

		const serveStaticFiles = () => {
			this.server.get('/*',
				// host static binaries
				(req, res, next) => this.serveStaticBuffers(req, res, next),
				// host static files
				Restify.plugins.serveStatic({
					directory: this.options.baseDir,
					default: 'index.html'
				}));
		};

		const handleWebSocketUpgrades = () => {
			this.wss.on('connection', (ws: WS, request: http.IncomingMessage) => {
				const url = QueryString.parseUrl(request.url);
				log.info('app', `New WebSocket connection on route ${url.url}`);
				for (const pair of this.webSocketRouteMap) {
					const [route, handler] = pair;
					if (route instanceof RegExp) {
						if (route.test(url.url)) {
							handler(ws, request);
							return;
						}
					} else if (route === url.url) {
						handler(ws, request);
						return;
					}
				}
				ws.close(1000, "No handler registered for this route.");
			});
		};

		// Start the web server, enable WebSockets, start serving static files,
		// and start handling WebSocket connections.
		this._server = Restify.createServer({ name: this.constructor.name });
		this.wss = new WS.Server({ server: this.server });
		this.server.listen(this.options.port, () => {
			this.options.baseUrl = this.options.baseUrl || this.server.url.replace(/\[::\]/u, '127.0.0.1');
			log.info('app', `${this.server.name} listening on ${JSON.stringify(this.server.address())}`);
			log.info('app', `baseUrl: ${this.baseUrl}`);
			log.info('app', `baseDir: ${this.baseDir}`);
			if (this.baseDir) {
				serveStaticFiles();
			}
			handleWebSocketUpgrades();
		});
	}

	private serveStaticBuffers(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
		// grab path part of URL
		const matches = BUFFER_REGEX.exec(req.url);
		const procPath = matches && matches[1] || null;

		// see if there's a handler registered for it
		if (!procPath || !this.bufferMap[procPath]) {
			return next();
		}

		// if so, serve binary
		res.sendRaw(200, this.bufferMap[procPath]);
		next();
	}

	/**
	 * Serve arbitrary binary blobs from a URL
	 * @param filename A unique string ID for the blob
	 * @param blob A binary blob
	 * @returns The URL to fetch the provided blob
	 */
	public registerStaticBuffer(filename: string, blob: Buffer): string {
		this.bufferMap[filename] = blob;
		return urlResolve(this.options.baseUrl, `${BUFFER_KEYWORD}/${filename}`);
	}

	/**
	 * Register a web socket connection handler for the given url route.
	 * @param route string or RegExp of the route to match against.
	 * @param handler The method to call when a new WebSocket connection is made with the matching route.
	 */
	public addWebSocketRoute(route: WebSocketRoute, handler: WebSocketUpgradeRequestHandler) {
		if (handler) {
			this.webSocketRouteMap.set(route, handler);
		} else {
			this.webSocketRouteMap.delete(route);
		}
	}

	/**
	 * Register an MRE adapter with this WebHost at the provided route.
	 * @param route The route at which to mount the MRE adapter.
	 * @param adapter The adapter to add.
	 */
	private addAdapter(route: WebSocketRoute, adapter: Adapter) {
		if (adapter) {
			log.info('app', `Added ${adapter.name} at route ${route}`);
			this.addWebSocketRoute(route, (ws, request) => {
				if (!verifyClient(request)) {
					ws.close(1000, "Unsupported MRE version.");
					return;
				}
				adapter.connectionRequest(ws, request);
			});
		} else {
			this.addWebSocketRoute(route, null);
		}
	}
}
