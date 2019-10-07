/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as WS from 'ws';
import { Context, ParameterSet } from '..';

/**
 * Base Adapter class. Adapters are where connections from hosts are accepted and mapped to Contexts. The host
 * connection requests a Context from a sessionId. If no matching Context is found, a new one is created and
 * the 'connection' event is raised.
 */
export abstract class Adapter extends EventEmitter {

	/**
	 * The name of the Adapter subclass.
	 */
	public abstract get name(): string;

	/**
	 * Called by WebHost when a new connection request is made.
	 * @hidden
	 */
	public abstract connectionRequest(ws: WS, request: http.IncomingMessage): void;

	/**
	 * The onConnection event is raised when a new Context is created for an application session. This happens when the
	 * first client connects to your application.
	 * @event
	 */
	public onConnection(handler: (context: Context, params: ParameterSet) => void): this {
		this.removeAllListeners('connection');
		this.addListener('connection', handler);
		return this;
	}
}
