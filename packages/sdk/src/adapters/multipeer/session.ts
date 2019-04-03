/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import deepmerge from 'deepmerge';
import { EventEmitter } from 'events';
import { Client, MissingRule, Rules, SessionExecution, SessionHandshake, SessionSync, SyncActor } from '.';
import { Connection, Message, UserLike } from '../..';
import { log } from '../../log';
import * as Protocols from '../../protocols';
import * as Payloads from '../../types/network/payloads';

/**
 * @hidden
 * Class for associating multiple client connections with a single app session.
 */
export class Session extends EventEmitter {
    // tslint:disable:variable-name
    private _clientSet: { [id: string]: Client } = {};
    private _actorSet: { [id: string]: Partial<SyncActor> } = {};
    private _assets: Array<Message<Payloads.LoadAssets | Payloads.CreateAsset>> = [];
    private _assetUpdateSet: { [id: string]: Partial<Payloads.AssetUpdate> } = {};
    private _userSet: { [id: string]: Partial<UserLike> } = {};
    private _protocol: Protocols.Protocol;
    // tslint:enable:variable-name

    public get conn() { return this._conn; }
    public get sessionId() { return this._sessionId; }
    public get protocol() { return this._protocol; }
    public get clients() {
        return Object.keys(this._clientSet).map(clientId =>
            this._clientSet[clientId]).sort((a, b) => a.order - b.order);
    }
    public get actors() { return Object.keys(this._actorSet).map(actorId => this._actorSet[actorId]); }
    public get assets() { return this._assets; }
    public get assetUpdates() {
        return Object.keys(this._assetUpdateSet).map(assetId => this._assetUpdateSet[assetId]);
    }
    public get rootActors() {
        return Object.keys(this._actorSet).filter(actorId =>
            !this._actorSet[actorId].created.message.payload.actor.parentId).map(actorId => this._actorSet[actorId]);
    }
    public get users() { return Object.keys(this._userSet).map(userId => this._userSet[userId]); }
    public get authoritativeClient() { return this.clients.find(client => client.authoritative); }
    public get peerAuthoritative() { return this._peerAuthoritative; }
    public get actorSet() { return this._actorSet; }
    public get assetUpdateSet() { return this._assetUpdateSet; }
    public get userSet() { return this._userSet; }

    public client = (clientId: string) => this._clientSet[clientId];
    public actor = (actorId: string) => this._actorSet[actorId];
    public user = (userId: string) => this._userSet[userId];
    public childrenOf = (parentId: string) => {
        return this.actors.filter(actor => actor.created.message.payload.actor.parentId === parentId);
    }
    public creatableChildrenOf = (parentId: string) => {
        return this.actors.filter(
            actor => actor.created.message.payload.actor.parentId === parentId && !!actor.created.message.payload.type);
    }

    /**
     * Creates a new Session instance
     */
    // tslint:disable-next-line:variable-name
    constructor(private _conn: Connection, private _sessionId: string, private _peerAuthoritative: boolean) {
        super();
        this.recvFromClient = this.recvFromClient.bind(this);
        this.recvFromApp = this.recvFromApp.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.leave = this.leave.bind(this);
        this._conn.on('close', this.disconnect);
        this._conn.on('error', this.disconnect);
    }

    /**
     * Performs handshake and sync with the app
     */
    public async connect() {
        try {
            const handshake = this._protocol = new SessionHandshake(this);
            await handshake.run();

            const sync = this._protocol = new SessionSync(this);
            await sync.run();

            const execution = this._protocol = new SessionExecution(this);
            execution.on('recv', message => this.recvFromApp(message));
            execution.startListening();
        } catch (e) {
            log.error('network', e);
            this.disconnect();
        }
    }

    public disconnect() {
        try {
            this._conn.off('close', this.disconnect);
            this._conn.off('error', this.disconnect);
            this._conn.close();
            this.emit('close');
        } catch { }
    }

    /**
     * Adds the client to the session
     */
    public async join(client: Client) {
        try {
            this._clientSet[client.id] = client;
            client.on('close', () => this.leave(client.id));
            // Synchronize app state to the client.
            await client.join(this);
            // Once the client is joined, further messages from the client will be processed by the session
            // (as opposed to a protocol class).
            client.on('recv', (_: Client, message: Message) => this.recvFromClient(client, message));
            // If we don't have an authoritative client, make this client authoritative.
            if (!this.authoritativeClient) {
                this.setAuthoritativeClient(client.id);
            }
        } catch (e) {
            log.error('network', e);
            this.leave(client.id);
        }
    }

    /**
     * Removes the client from the session
     */
    public leave(clientId: string) {
        try {
            const client = this._clientSet[clientId];
            delete this._clientSet[clientId];
            if (client) {
                // If the client is associated with a userId, inform app the user is leaving
                if (client.userId) {
                    this.protocol.sendPayload({
                        type: 'user-left',
                        userId: client.userId
                    } as Payloads.UserLeft);
                }
                // Select another client to be the authoritative peer.
                // TODO: Make selection criteria more intelligent (look at latency, prefer non-mobile, ...)
                if (client.authoritative) {
                    const nextClient = this.clients.find(c => c.isJoined());
                    if (nextClient) {
                        this.setAuthoritativeClient(nextClient.id);
                    }
                }
            }
            // If this was the last client then shutdown the session
            if (!this.clients.length) {
                this._conn.close();
            }
        } catch { }
    }

    private setAuthoritativeClient(clientId: string) {
        if (!this._clientSet[clientId]) {
            // tslint:disable-next-line:no-console
            console.error(`[ERROR] setAuthoritativeClient: client ${clientId} does not exist.`);
        }
        this._clientSet[clientId].setAuthoritative(true);
        this.clients
            .filter(client => client.id !== clientId && client.isJoined())
            .forEach(client => client.setAuthoritative(false));
    }

    private recvFromClient = (client: Client, message: Message) => {
        message = this.preprocessFromClient(client, message);
        if (message) {
            this.sendToApp(message);
        }
    }

    private recvFromApp = (message: Message) => {
        message = this.preprocessFromApp(message);
        if (message) {
            this.sendToClients(message);
        }
    }

    public preprocessFromApp(message: Message): Message {
        const rule = Rules[message.payload.type] || MissingRule;
        const beforeReceiveFromApp = rule.session.beforeReceiveFromApp || (() => message);
        return beforeReceiveFromApp(this, message);
    }

    public preprocessFromClient(client: Client, message: Message): Message {
        // Precaution: If we don't recognize this client, drop the message.
        if (!this._clientSet[client.id]) {
            return undefined;
        }
        if (message.payload && message.payload.type && message.payload.type.length) {
            const rule = Rules[message.payload.type] || MissingRule;
            const beforeReceiveFromClient = rule.session.beforeReceiveFromClient || (() => message);
            message = beforeReceiveFromClient(this, client, message);
        }
        return message;
    }

    public sendToApp(message: Message) {
        this.protocol.sendMessage(message);
    }

    public sendToClients(message: Message, filterFn?: (value: Client) => any) {
        const rule = Rules[message.payload.type] || MissingRule;
        const ruleFilter = rule.session.shouldSendToClient || (() => true);
        const sendFilter = filterFn || (() => true);
        const clients = this.clients.filter(c => ruleFilter(this, c, message) && sendFilter(c));
        for (const client of clients) {
            client.send({ ...message });
        }
    }

    public sendPayloadToClients(payload: Partial<Payloads.Payload>, filterFn?: (value: Client) => any) {
        this.sendToClients({ payload }, filterFn);
    }

    public findAnimation(syncActor: Partial<SyncActor>, animationName: string) {
        return (syncActor.createdAnimations || []).find(item => item.message.payload.animationName === animationName);
    }

    public isAnimating(syncActor: Partial<SyncActor>): boolean {
        if ((syncActor.createdAnimations || []).some(item => item.enabled)) {
            return true;
        }
        if (syncActor.created &&
            syncActor.created.message &&
            syncActor.created.message.payload &&
            syncActor.created.message.payload.actor) {
            const parent = this._actorSet[syncActor.created.message.payload.actor.parentId];
            if (parent) {
                return this.isAnimating(parent);
            }
        }
        return false;
    }

    public cacheCreateActorMessage(message: Message<Payloads.CreateActorCommon>) {
        let syncActor = this.actorSet[message.payload.actor.id];
        if (!syncActor) {
            const createActor = deepmerge({ message }, {});
            syncActor = this.actorSet[message.payload.actor.id] = { created: createActor };
            syncActor.actorId = message.payload.actor.id;
        }
    }

    public cacheActorUpdateMessage(message: Message<Payloads.ActorUpdate>) {
        const syncActor = this.actorSet[message.payload.actor.id];
        if (syncActor) {
            // Merge the update into the existing actor.
            syncActor.created.message.payload.actor
                = deepmerge(syncActor.created.message.payload.actor, message.payload.actor);
        }
    }

    public cacheAssetCreationMessage(
        message: Message<Payloads.LoadAssets | Payloads.CreateAsset>) {

        // TODO: Is each load-asset unique? Can the same asset be loaded twice?
        this.assets.push({ ...message });
    }

    public cacheAssetUpdateMessage(message: Message<Payloads.AssetUpdate>) {
        let existing = this.assetUpdateSet[message.payload.asset.id];
        if (!existing) {
            existing = this.assetUpdateSet[message.payload.asset.id] = { ...message.payload };
        } else {
            // Merge with existing message.
            // TODO: Is this correct? This is purely additive.
            existing = {
                ...existing,
                ...message.payload
            };
        }
    }
}
