/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';
import {
    Actor,
    Connection,
    Logger,
    NullConnection,
    NullLogger,
    NullStorage,
    Services,
    Storage,
    Telemetry,
    User,
} from '../..';
import { InternalContext } from '../../types/internal/context';
import { AssetManager } from '../../types/runtime/assets';
import BufferedEventEmitter from '../../utils/bufferedEventEmitter';

/**
 * Settings used to configure a `Context` instance.
 */
export interface ContextSettings {
    connection?: Connection;
    storage?: Storage;
    logger?: Logger;
    sessionId?: string;
}

/**
 * Container for an application session. The Context contains all application state for a session of your application.
 * This includes Actors, Users, Assets, and other state.
 */
export class Context implements Services {
    // tslint:disable:variable-name
    private _internal: InternalContext;
    /** @hidden */
    public get internal() { return this._internal; }

    private _emitter = new BufferedEventEmitter();
    /** @hidden */
    public get emitter() { return this._emitter; }

    private _assets: AssetManager;
    private _sessionId: string;
    private _storage: Storage;
    private _conn: Connection;
    private _logger: Logger;
    private _telemetry: Telemetry;
    // tslint:enable:variable-name

    public get assets() { return this._assets; }
    public get sessionId() { return this._sessionId; }
    public get storage() { return this._storage; }
    public get conn() { return this._conn; }
    public get logger() { return this._logger; }
    public get telemetry() { return this._telemetry; }
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
        this._storage = settings.storage || new NullStorage();
        this._conn = settings.connection || new NullConnection();
        this._logger = settings.logger || new NullLogger();
        this._sessionId = settings.sessionId || UUID();
        this._internal = new InternalContext(this);
        this._assets = new AssetManager(this);
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
        this.emitter.on('started', handler);
        return this;
    }

    /**
     * The onStopped event is raised before the Context starts shutting down, which happens after the last user
     * disconnects.
     * @event
     */
    public onStopped(handler: () => void): this {
        this.emitter.on('stopped', handler);
        return this;
    }

    /**
     * The onUserJoined event is raised after a new user has joined the Context.
     * @event
     */
    public onUserJoined(handler: (user: User) => void): this {
        this.emitter.on('user-joined', handler);
        return this;
    }

    /**
     * The 'onUserLeft event is raised when the given user has left the Context. After the last user leaves, the Context
     * will be shutdown (and a 'stopped' event will soon follow).
     * @event
     */
    public onUserLeft(handler: (user: User) => void): this {
        this.emitter.on('user-left', handler);
        return this;
    }

    /**
     * @hidden
     * (for now)
     */
    public onActorCreated(handler: (user: User) => void): this {
        this.emitter.on('actor-created', handler);
        return this;
    }

    /**
     * @hidden
     * (for now)
     */
    public onActorDestroyed(handler: (user: User) => void): this {
        this.emitter.on('actor-destroyed', handler);
        return this;
    }

    /**
     * @hidden
     */
    // tslint:disable-next-line:max-line-length
    public onReceiveRPC(handler: (procName: string, channelName: string, args: any[]) => void): this {
        this.emitter.on('context.receive-rpc', handler);
        return this;
    }
}
