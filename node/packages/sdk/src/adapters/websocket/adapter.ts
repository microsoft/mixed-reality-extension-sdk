/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as http from 'http';
import QueryString from 'query-string';
import * as Restify from 'restify';
import UUID from 'uuid/v4';
import * as WS from 'ws';
import { Adapter, AdapterOptions } from '..';
import { Context, WebSocket } from '../..';
import * as Constants from '../../constants';
import { verifyClient } from '../../utils/verifyClient';
import { log } from './../../log';

/**
 * WebSocket Adapter options.
 */
export type WebSocketAdapterOptions = AdapterOptions;

/**
 * The `WebSocketAdapter` is appropriate to use when the host environment has an authoritative simluation, and that
 * authoritative simulation is the only connection made to the Mixed Reality Extension (MRE) app.
 *
 * Example hosts:
 *  - Single player environments
 *  - Server-based multiuser topologies
 */
export class WebSocketAdapter extends Adapter {
    /**
     * Creates a new instance of the WebSocket Adapter.
     */
    constructor(options?: WebSocketAdapterOptions) {
        super(options);
    }

    /**
     * Start the adapter listening for new connections.
     * @param onNewConnection Handler for new connections.
     */
    public listen(): Promise<Restify.Server> {
        if (!this.server) {
            // If necessary, create a new web server.
            return new Promise<Restify.Server>((resolve) => {
                const server = this.server = Restify.createServer({ name: "WebSocket Adapter" });
                this.server.listen(this.port, () => {
                    this.startListening();
                    resolve(server);
                });
            });
        } else {
            // Already have a server, so just start listening.
            this.startListening();
            return Promise.resolve(this.server);
        }
    }

    private startListening() {
        // Create a server for upgrading HTTP connections to WebSockets.
        const wss = new WS.Server({ server: this.server, verifyClient });

        // Handle connection upgrades
        wss.on('connection', (ws: WS, request: http.IncomingMessage) => {
            log.info(null, "New WebSocket connection");

            // Read the sessionId header.
            let sessionId = request.headers[Constants.SessionHeader] as string || UUID();
            sessionId = decodeURIComponent(sessionId);

            // Parse URL parameters.
            const params = QueryString.parseUrl(request.url).query;

            // Wrap the new WebSocket in a MRESDK.WebSocket.
            const connection = new WebSocket(ws);

            const context = new Context({
                sessionId,
                connection
            });
            context.internal.start();
            this.emitter.emit('connection', context, params);
        });
    }
}
