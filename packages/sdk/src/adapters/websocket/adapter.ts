/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as http from 'http';
import QueryString from 'query-string';
import UUID from 'uuid/v4';
import * as WS from 'ws';
import { Adapter } from '..';
import { Context, WebSocket } from '../..';
import * as Constants from '../../constants';
import { log } from './../../log';

// tslint:disable-next-line:no-var-requires
const forwarded = require('forwarded-for');

/**
 * The `WebSocketAdapter` is appropriate to use when the host environment has an authoritative simluation, and that
 * authoritative simulation is the only connection made to the Mixed Reality Extension (MRE) app.
 *
 * Example hosts:
 *  - Single player environments
 *  - Server-based multiuser topologies
 */
export class WebSocketAdapter extends Adapter {

	/** @inheritdoc */
	public get name(): string { return this. constructor.name; }

	/** @inheritdoc */
	public connectionRequest(ws: WS, request: http.IncomingMessage) {
		log.info('network', "New WebSocket connection");

		// Read the sessionId header.
		let sessionId = request.headers[Constants.HTTPHeaders.SessionID] as string || UUID();
		sessionId = decodeURIComponent(sessionId);

		// Parse URL parameters.
		const params = QueryString.parseUrl(request.url).query;

		// Get the client's IP address rather than the last proxy connecting to you.
		const address = forwarded(request, request.headers);

		// Create a WebSocket for the connection.
		const connection = new WebSocket(ws, address.ip);

		// Create a new context for the connection.
		const context = new Context({
			sessionId,
			connection
		});

		// Start the context listening to network traffic.
		context.internal.startListening().catch(() => connection.close());

		// Pass the new context to the app
		this.emit('connection', context, params);

		// Start context's update loop.
		context.internal.start();
	}
}
