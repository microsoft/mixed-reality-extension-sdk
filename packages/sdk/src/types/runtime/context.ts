/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import events from 'events';
import UUID from 'uuid/v4';
import {
    Actor,
    Connection,
    NullConnection,
    User,
} from '../..';
import { InternalContext } from '../../types/internal/context';
import { AssetManager } from '../../types/runtime/assets';

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
    // tslint:disable:variable-name
    private _internal: InternalContext;
    /** @hidden */
    public get internal() { return this._internal; }

    private _emitter = new events.EventEmitter();
    /** @hidden */
    public get emitter() { return this._emitter; }

    private _assetManager: AssetManager;
    private _sessionId: string;
    private _conn: Connection;
    // tslint:enable:variable-name

    public get assetManager() { return this._assetManager; }
    public get sessionId() { return this._sessionId; }
    public get conn() { return this._conn; }
    public get actors() { return Object.keys(this.internal.actorSet).map(actorId => this.internal.actorSet[actorId]); }
    public get rootActors() {
        return Object.keys(this.internal.actorSet)
            .filter(actorId => !this.internal.actorSet[actorId].parent).map(actorId => this.internal.actorSet[actorId]);
    }
    public get users() { return Object.keys(this.internal.userSet).map(userId => this.internal.userSet[userId]); }

    public actor = (actorId: string): Actor => this.internal.actorSet[actorId];
    public user = (userId: string): User => this.internal.userSet[userId];

    /**
     * Creates a new `Context` instance.
     */
    // tslint:disable-next-line:member-ordering
    constructor(settings: ContextSettings) {
        this._conn = settings.connection || new NullConnection();
        this._sessionId = settings.sessionId || UUID();
        this._internal = new InternalContext(this);
        this._assetManager = new AssetManager(this);
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
    // tslint:disable-next-line:max-line-length
    public onReceiveRPC(handler: (procName: string, channelName: string, args: any[]) => void): this {
        this.emitter.addListener('context.receive-rpc', handler);
        return this;
    }

    /**
     * @hidden
     */
    // tslint:disable-next-line:max-line-length
    public offReceiveRPC(handler: (procName: string, channelName: string, args: any[]) => void): this {
        this.emitter.removeListener('context.receive-rpc', handler);
        return this;
    }
}
