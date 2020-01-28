/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import events from 'events';
import {
	Actor,
	Connection,
	Guid,
	newGuid,
	NullConnection,
	User,
} from '../..';
import { RPC, RPCChannels } from '../../rpc';
import { InternalContext } from '../internal/context';
import * as Payloads from '../network/payloads';

/**
 * Settings used to configure a `Context` instance.
 */
export interface ContextSettings {
	connection?: Connection;
	sessionId?: string;
}

/**
 * Container for an application session. The Context contains all application state for a session of your application.
 * This includes Actors, Users, Assets, and other state.
 */
export class Context {
	private _internal: InternalContext;
	/** @hidden */
	public get internal() { return this._internal; }

	private _emitter = new events.EventEmitter();
	/** @hidden */
	public get emitter() { return this._emitter; }

	private _sessionId: string;
	private _conn: Connection;
	private _rpcChannels: RPCChannels;
	private _rpc: RPC;

	public get sessionId() { return this._sessionId; }
	public get conn() { return this._conn; }
	public get actors() { return [...this.internal.actorSet.values()]; }
	public get rootActors() { return this.actors.filter(a => !a.parent); }
	public get users() { return [...this.internal.userSet.values()]; }
	public get rpcChannels() { return this._rpcChannels; }
	public get rpc() { return this._rpc; }
	public actor = (actorId: Guid): Actor => this.internal.actorSet.get(actorId);
	public user = (userId: Guid): User => this.internal.userSet.get(userId);

	/**
	 * Creates a new `Context` instance.
	 */
	constructor(settings: ContextSettings) {
		this._conn = settings.connection || new NullConnection();
		this._sessionId = settings.sessionId || newGuid().toString();
		this._internal = new InternalContext(this);
		this._rpcChannels = new RPCChannels();
		this._rpc = new RPC(this);
		this.rpcChannels.setChannelHandler(null, this._rpc);
	}

	/**
	 * Exits this context.
	 */
	public quit() {
		// Closing the connection triggers events that will tear down the context.
		this.conn.close();
	}

	/**
	 * The onStarted event is raised after the Context is fully initialized and ready for your application logic to
	 * start executing.
	 * @event
	 */
	public onStarted(handler: () => void): this {
		this.emitter.addListener('started', handler);
		return this;
	}

	/**
	 * The onStopped event is raised before the Context starts shutting down, which happens after the last user
	 * disconnects.
	 * @event
	 */
	public onStopped(handler: () => void): this {
		this.emitter.addListener('stopped', handler);
		return this;
	}

	/**
	 * The onUserJoined event is raised after a new user has joined the Context.
	 * @event
	 */
	public onUserJoined(handler: (user: User) => void): this {
		this.emitter.addListener('user-joined', handler);
		return this;
	}

	/**
	 * Remove the onUserJoined event handler from the Context.
	 * @event
	 */
	public offUserJoined(handler: (user: User) => void): this {
		this.emitter.removeListener('user-joined', handler);
		return this;
	}

	/**
	 * The onUserLeft event is raised when the given user has left the Context. After the last user leaves, the Context
	 * will be shutdown (and a 'stopped' event will soon follow).
	 * @event
	 */
	public onUserLeft(handler: (user: User) => void): this {
		this.emitter.addListener('user-left', handler);
		return this;
	}

	/**
	 * Remove the onUserLeft event handler from the Context
	 * @event
	 */
	public offUserLeft(handler: (user: User) => void): this {
		this.emitter.removeListener('user-left', handler);
		return this;
	}

	/**
	 * @hidden
	 * (for now)
	 */
	public onActorCreated(handler: (actor: Actor) => void): this {
		this.emitter.addListener('actor-created', handler);
		return this;
	}

	/**
	 * @hidden
	 * (for now)
	 */
	public offActorCreated(handler: (actor: Actor) => void): this {
		this.emitter.removeListener('actor-created', handler);
		return this;
	}

	/**
	 * @hidden
	 * (for now)
	 */
	public onActorDestroyed(handler: (actor: Actor) => void): this {
		this.emitter.addListener('actor-destroyed', handler);
		return this;
	}

	/**
	 * @hidden
	 * (for now)
	 */
	public offActorDestroyed(handler: (actor: Actor) => void): this {
		this.emitter.removeListener('actor-destroyed', handler);
		return this;
	}

	/**
	 * @hidden
	 */
	public receiveRPC(payload: Payloads.EngineToAppRPC) {
		this.rpcChannels.receive(payload);
	}

	/**
	 * Collect and return a snapshot of the current resource usage of the MRE subsystem. For Node process stats,
	 * use `process.resourceUsage()`.
	 */
	public getStats() {
		return this.internal.getStats();
	}
}
