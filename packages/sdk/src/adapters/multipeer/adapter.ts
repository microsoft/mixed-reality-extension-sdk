/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as http from 'http';
import QueryString from 'query-string';
import UUID from 'uuid/v4';
import * as WS from 'ws';
import { Adapter, ClientHandshake, ClientStartup } from '..';
import { Context, ParameterSet, Pipe, WebSocket } from '../../';
import * as Constants from '../../constants';
import { log } from './../../log';
import { Client } from './client';
import { Session } from './session';

// tslint:disable-next-line:no-var-requires
const forwarded = require('forwarded-for');

/**
 * Multi-peer adapter options
 */
export type MultipeerAdapterOptions = {
	/**
	 * @member peerAuthoritative (Optional. Default: true) Whether or not to run in the `peer-authoritative`
	 * operating model. When true, one peer is picked to synchonize actor changes, animation states, etc.
	 * When false, no state is synchronized between peers.
	 */
	peerAuthoritative?: boolean;
};

/**
 * The `MultipeerAdapter` is appropriate to use when the host environment has no authoritative
 * server simulation, where each client owns some part of the simulation, and a connection from each client to the Mixed
 * Reality Extension (MRE) app is necessary. The MultipeerAdapter serves as an aggregation point for these client
 * connections. This adapter is responsible for app state synchronization to new clients, and for managing distributed
 * state ownership (i.e., which client is authoritative over what parts of the simulated state).
 *
 * Example hosts:
 *  - AltspaceVR
 *  - Peer-to-peer multiuser topologies
 */
export class MultipeerAdapter extends Adapter {

	/** @inheritdoc */
	public get name(): string { return this. constructor.name; }

	// FUTURE: Make these child processes?
	private sessions: { [id: string]: Session } = {};

	/**
	 * Creates a new instance of the Multi-peer Adapter
	 */
	constructor(private options?: MultipeerAdapterOptions) {
		super();
		this.options = {
			peerAuthoritative: true,
			...this.options
		};
	}

	/** @inheritdoc */
	public async connectionRequest(ws: WS, request: http.IncomingMessage) {
		try {
			log.info('network', "New Multi-peer connection");

			// Read the sessionId header.
			let sessionId = request.headers[Constants.HTTPHeaders.SessionID] as string || UUID();
			sessionId = decodeURIComponent(sessionId);

			// Parse URL parameters.
			const params = QueryString.parseUrl(request.url).query;

			// Get the client's IP address rather than the last proxy connecting to you.
			const address = forwarded(request, request.headers);

			// Create a WebSocket for this connection.
			const conn = new WebSocket(ws, address.ip);

			// Instantiate a client for this connection.
			const client = new Client(conn);

			// Join the client to the session.
			await this.joinClientToSession(client, sessionId, params);
		} catch (e) {
			log.error('network', e);
			ws.close();
		}
	}

	private async getOrCreateSession(sessionId: string, params: ParameterSet) {
		let session = this.sessions[sessionId];
		if (!session) {
			// Create an in-memory "connection" (If the app were running remotely, we would connect
			// to it via WebSocket here instead)
			const pipe = new Pipe();
			// Create a new context for the connection, passing it the remote side of the pipe.
			const context = new Context({
				sessionId,
				connection: pipe.remote
			});
			// Start the context listening to network traffic.
			context.internal.startListening().catch(() => pipe.remote.close());
			// Instantiate a new session.
			session = this.sessions[sessionId] = new Session(
				pipe.local, sessionId, this.options.peerAuthoritative);
			// Handle session close.
			const $this = this;
			session.on('close', () => delete $this.sessions[sessionId]);
			// Connect the session to the context.
			await session.connect(); // Allow exceptions to propagate.
			// Pass the new context to the app.
			this.emit('connection', context, params);
			// Start context's update loop.
			context.internal.start();
		}
		return session;
	}

	private async joinClientToSession(client: Client, sessionId: string, params: QueryString.OutputParams) {
		try {
			// Handshake with the client.
			const handshake = new ClientHandshake(client, sessionId);
			await handshake.run();

			// Measure the connection quality and wait for sync-request message.
			const startup = new ClientStartup(client, handshake.syncRequest);
			await startup.run();

			// Get the session for the sessionId.
			const session = await this.getOrCreateSession(sessionId, params);

			// Join the client to the session.
			await session.join(client);
		} catch (e) {
			log.error('network', e);
			client.conn.close();
		}
	}
}
