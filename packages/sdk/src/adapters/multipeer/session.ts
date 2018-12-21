/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import deepmerge from 'deepmerge';
import { EventEmitter } from 'events';
import { Client, SessionExecution, SessionHandshake, SessionSync, SyncActor } from '.';
import * as MRESDK from '../..';
import * as Protocols from '../../protocols';
import * as Payloads from '../../types/network/payloads';

/**
 * @hidden
 * Class for associating multiple client connections with a single app session
 */
export class Session extends EventEmitter {
    // tslint:disable:variable-name
    private _clientSet: { [id: string]: Client } = {};
    private _actorSet: { [id: string]: Partial<SyncActor> } = {};
    private _assetSet: Array<MRESDK.Message<Payloads.LoadAssets>> = [];
    private _userSet: { [id: string]: Partial<MRESDK.UserLike> } = {};
    private _protocol: Protocols.Protocol;
    // tslint:enable:variable-name

    public get conn() { return this._conn; }
    public get sessionId() { return this._sessionId; }
    public get protocol() { return this._protocol; }
    public get clients() { return Object.keys(this._clientSet).map(clientId => this._clientSet[clientId]); }
    public get actors() { return Object.keys(this._actorSet).map(actorId => this._actorSet[actorId]); }
    public get rootActors() {
        return Object.keys(this._actorSet).filter(actorId =>
            !this._actorSet[actorId].created.message.payload.actor.parentId).map(actorId => this._actorSet[actorId]);
    }
    public get assetSet() { return this._assetSet; }
    public get users() { return Object.keys(this._userSet).map(userId => this._userSet[userId]); }
    public get authoritativeClient() { return this.clients.sort((a, b) => a.order - b.order).shift(); }
    public get peerAuthoritative() { return this._peerAuthoritative; }
    public get actorSet() { return this._actorSet; }
    public get userSet() { return this._userSet; }

    public client = (clientId: string) => this._clientSet[clientId];
    public actor = (actorId: string) => this._actorSet[actorId];
    public user = (userId: string) => this._userSet[userId];
    public childrenOf = (parentId: string) => {
        return this.actors.filter(actor => actor.created.message.payload.actor.parentId === parentId);
    }

    /**
     * Creates a new Session instance
     */
    // tslint:disable-next-line:variable-name
    constructor(private _conn: MRESDK.Connection, private _sessionId: string, private _peerAuthoritative: boolean) {
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
    public connect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Start with Handshake protocol
            const handshake = this._protocol = new SessionHandshake(this);
            handshake.on('protocol.handshake-complete', () => {
                // Sync app state to session
                const sync = this._protocol = new SessionSync(this);
                sync.on('protocol.sync-complete', () => {
                    // Switch to Execution protocol
                    const execution = this._protocol = new SessionExecution(this);
                    execution.on('recv', message => this.recvFromApp(message));
                    execution.startListening();
                    resolve();
                });
                sync.startListening();
            });
            handshake.startListening();
        });
    }

    public disconnect() {
        this._conn.off('close', this.disconnect);
        this._conn.off('error', this.disconnect);
        this._conn.close();
        this.emit('close');
    }

    /**
     * Adds the client to the session
     */
    public async join(client: Client): Promise<void> {
        if (this.authoritativeClient) {
            await this.authoritativeClient.joinedOrLeft();
            // console.log("authoritative client finished joining (or died trying)");
        }
        this._clientSet[client.id] = client;
        client.on('close', () => this.leave(client.id));
        await client.join(this);
        client.on('recv', (_: Client, message: MRESDK.Message) => this.recvFromClient(client, message));
        if (this.authoritativeClient) {
            this.authoritativeClient.sendPayload({
                type: 'set-authoritative',
                authoritative: this.peerAuthoritative,
            } as Payloads.SetAuthoritative);
        }
    }

    /**
     * Removes the client from the session
     */
    public leave(clientId: string) {
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
            // Select another peer to be the authoritative peer
            if (this.authoritativeClient) {
                this.authoritativeClient.sendPayload({
                    type: 'set-authoritative',
                    authoritative: this.peerAuthoritative
                } as Payloads.SetAuthoritative);
            }
        }
        // If this was the last client then shutdown the session
        if (!this.clients.length) {
            this._conn.close();
        }
    }

    private recvFromClient = (client: Client, message: MRESDK.Message) => {
        message = this.preprocessFromClient(client, message);
        if (message) {
            this.sendToApp(message);
        }
    }

    private recvFromApp = (message: MRESDK.Message) => {
        message = this.preprocessFromApp(message);
        if (message) {
            this.sendToClients(message);
        }
    }

    private preprocessFromApp(message: MRESDK.Message): MRESDK.Message {
        message.payload = this.preprocessPayloadFromApp(message.payload, message);
        return message.payload ? message : undefined;
    }

    private preprocessPayloadFromApp(
        payload: Partial<Payloads.Payload>,
        message: MRESDK.Message): Partial<Payloads.Payload> {
        const handler = (this as any)[`app-preprocess-${payload.type}`] || (() => payload);
        return handler(payload, message);
    }

    private preprocessFromClient(client: Client, message: MRESDK.Message): MRESDK.Message {
        if (!this._clientSet[client.id]) {
            return undefined;
        }
        if (message.payload && message.payload.type && message.payload.type.length) {
            const handler = (this as any)[`client-preprocess-${message.payload.type}`] || (() => message.payload);
            message.payload = handler(client, message.payload);
        }
        return message.payload ? message : undefined;
    }

    private sendToApp(message: MRESDK.Message) {
        this.protocol.sendMessage(message);
    }

    private sendToClients(message: MRESDK.Message, excludeId?: string) {
        const clients = this.clients.filter(client => client.id !== excludeId);
        for (const client of clients) {
            client.send({ ...message });
        }
    }

    private sendPayloadToClients(payload: Partial<Payloads.Payload>, excludeId?: string) {
        const clients = this.clients.filter(client => client.id !== excludeId);
        for (const client of clients) {
            client.sendPayload({ ...payload });
        }
    }

    private findAnimation(syncActor: Partial<SyncActor>, animationName: string) {
        return (syncActor.createdAnimations || []).find(item => item.message.payload.animationName === animationName);
    }

    private isAnimating(syncActor: Partial<SyncActor>) {
        return !!(syncActor.createdAnimations || []).find(item => item.animating);
    }

    private createActor(payload: Payloads.CreateActorCommon, message: MRESDK.Message<Payloads.CreateActorCommon>) {
        let syncActor = this.actorSet[payload.actor.id];
        if (!syncActor) {
            const createActor = deepmerge({ message }, {});
            syncActor = this.actorSet[payload.actor.id] = { created: createActor };
            syncActor.actorId = payload.actor.id;
        }
    }

    /** @private */
    public 'app-preprocess-create-animation' = (
        payload: Payloads.CreateAnimation,
        message: MRESDK.Message<Payloads.CreateAnimation>) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            syncActor.createdAnimations = syncActor.createdAnimations || [];
            syncActor.createdAnimations.push({ message, animating: false });
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-start-animation' = (payload: Payloads.StartAnimation) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            const animation = this.findAnimation(syncActor, payload.animationName);
            if (animation) {
                animation.animating = true;
            }
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-stop-animation' = (payload: Payloads.StopAnimation) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            const animation = this.findAnimation(syncActor, payload.animationName);
            if (animation) {
                animation.animating = false;
            }
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-resume-animation' = (payload: Payloads.ResumeAnimation) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            const animation = this.findAnimation(syncActor, payload.animationName);
            if (animation) {
                animation.animating = true;
            }
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-pause-animation' = (payload: Payloads.PauseAnimation) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            const animation = this.findAnimation(syncActor, payload.animationName);
            if (animation) {
                animation.animating = false;
            }
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-load-assets' = (
        payload: Payloads.LoadAssets,
        message: MRESDK.Message<Payloads.LoadAssets>) => {
        this._assetSet.push(message);
        return payload;
    }

    /** @private */
    public 'app-preprocess-create-empty' = (
        payload: Payloads.CreateEmpty,
        message: MRESDK.Message<Payloads.CreateEmpty>) => {
        this.createActor(payload, message);
        return payload;
    }

    /** @private */
    public 'app-preprocess-create-primitive' = (
        payload: Payloads.CreatePrimitive,
        message: MRESDK.Message<Payloads.CreatePrimitive>) => {
        this.createActor(payload, message);
        return payload;
    }

    /** @private */
    public 'app-preprocess-create-from-gltf' = (
        payload: Payloads.CreateFromGLTF,
        message: MRESDK.Message<Payloads.CreateFromGLTF>) => {
        this.createActor(payload, message);
        return payload;
    }

    /** @private */
    public 'app-preprocess-create-from-library' = (
        payload: Payloads.CreateFromLibrary,
        message: MRESDK.Message<Payloads.CreateFromLibrary>) => {
        this.createActor(payload, message);
        return payload;
    }

    /** @private */
    public 'app-preprocess-create-from-prefab' = (
        payload: Payloads.CreateFromPrefab,
        message: MRESDK.Message<Payloads.CreateFromPrefab>) => {
        this.createActor(payload, message);
        return payload;
    }

    /** @private */
    public 'app-preprocess-actor-update' = (payload: Payloads.ActorUpdate) => {
        const syncActor = this.actorSet[payload.actor.id];
        if (syncActor) {
            // Merge the update into the existing actor
            syncActor.created.message.payload.actor = deepmerge(syncActor.created.message.payload.actor, payload.actor);
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-state-update' = (stateUpdate: Payloads.StateUpdate, message: MRESDK.Message) => {
        const payloads: Array<Partial<Payloads.Payload>> = [];
        for (let payload of stateUpdate.payloads) {
            payload = this.preprocessPayloadFromApp(payload, message);
            if (payload) {
                payloads.push(payload);
            }
        }
        stateUpdate.payloads = payloads;
        return stateUpdate;
    }

    /** @private */
    public 'app-preprocess-destroy-actors' = (payload: Payloads.DestroyActors) => {
        for (const actorId of payload.actorIds) {
            delete this._actorSet[actorId];
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-enable-text' = (payload: Payloads.EnableText) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            // Merge the new component into the existing actor
            syncActor.created.message.payload.actor.text =
                deepmerge(syncActor.created.message.payload.actor.text || {}, payload.text);
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-enable-light' = (payload: Payloads.EnableLight) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            // Merge the new component into the existing actor
            syncActor.created.message.payload.actor.light =
                deepmerge(syncActor.created.message.payload.actor.light || {}, payload.light);
        }
        return payload;
    }

    /** @private */
    public 'app-preprocess-enable-rigidbody' = (payload: Payloads.EnableRigidBody) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            // Merge the new component into the existing actor
            syncActor.created.message.payload.actor.rigidBody =
                deepmerge(syncActor.created.message.payload.actor.rigidBody || {}, payload.rigidBody);
        }
        return payload;
    }

    public 'app-preprocess-enable-collider' = (payload: Payloads.EnableCollider) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            // Merge the new component into the existing actor
            syncActor.created.message.payload.actor.collider =
                deepmerge(syncActor.created.message.payload.actor.collider || {}, payload.collider);
        }
    }

    /** @private */
    public 'app-preprocess-app2engine-rpc' = (payload: Payloads.AppToEngineRPC) => {
        // Send the message only to the specified user.
        if (payload.userId) {
            const client = this.clients.find(value => value.userId === payload.userId);
            if (client) {
                client.sendPayload(payload);
            }
        } else {
            // If no user specified then allow the message to be sent to all users.
            return payload;
        }
    }

    /** @private */
    public 'app-preprocess-set-behavior' = (payload: Payloads.SetBehavior) => {
        const syncActor = this.actorSet[payload.actorId];
        if (syncActor) {
            syncActor.behavior = payload.behaviorType;
        }
        return payload;
    }

    public 'client-preprocess-operation-result' = (client: Client, payload: Payloads.OperationResult) => {
        if (client.authoritative) {
            // Allow the message to propagate to the app
            return payload;
        }
    }

    /** @private */
    public 'client-preprocess-user-joined' = (client: Client, payload: Payloads.UserJoined) => {
        // Associate the client connection with the user id.
        client.userId = payload.user.id;

        // add remote ip address to the joining user
        if (client.conn instanceof MRESDK.WebSocket) {
            payload.user.properties = {
                ...payload.user.properties,
                remoteAddress: client.conn.remoteAddress
            };
        }

        return payload;
    }

    /** @private */
    public 'client-preprocess-actor-update' = (client: Client, payload: Payloads.ActorUpdate) => {
        // Check that this is the authoritative client
        if (client.authoritative) {
            // Check that the actor exists
            const syncActor = this.actorSet[payload.actor.id];
            if (syncActor) {
                // Merge the update into the existing actor
                syncActor.created.message.payload.actor =
                    deepmerge(syncActor.created.message.payload.actor, payload.actor);
                // Send the payload as an 'actor-correction' so that the change will be interpolated rather than
                // applied immediately to the actor.
                const actorCorrection = deepmerge(payload, {});
                actorCorrection.type = 'actor-correction';
                // If the actor is currently animating, then strip the transform from the update. Sending transform
                // updates to other clients would break animations on those clients.
                if (this.isAnimating(syncActor)) {
                    actorCorrection.actor.transform = undefined;
                }
                // Sync the change to the other clients
                this.sendPayloadToClients(actorCorrection, client.id);
                // Allow the message to propagate to the app
                // TODO: Only forward payload to the app if the app has registered subscriptions for this kind of
                // update on this actor.
                return payload;
            }
        }
    }

    /** @private */
    public 'client-preprocess-object-spawned' = (client: Client, payload: Payloads.ObjectSpawned) => {
        // Check that this is the authoritative client
        if (client.authoritative) {
            // Create local representations of the actors
            for (const spawned of payload.actors) {
                let syncActor = this.actorSet[spawned.id];
                if (!syncActor) {
                    syncActor = this._actorSet[spawned.id] = {
                        created: {
                            message: {
                                payload: {
                                    actor: spawned
                                }
                            } as MRESDK.Message<Payloads.CreateActorCommon>
                        }
                    };
                    syncActor.actorId = spawned.id;
                }
            }
            // Allow the message to propagate to the app
            return payload;
        }
    }

    /** @private */
    public 'client-preprocess-stop-animation' = (client: Client, payload: Payloads.StopAnimation) => {
        // Check that this is the authoritative client
        if (client.authoritative) {
            // Check that the actor exists
            const syncActor = this.actorSet[payload.actorId];
            if (syncActor) {
                const animation = this.findAnimation(syncActor, payload.animationName);
                if (animation) {
                    animation.animating = false;
                }
            }
            // Sync the change to the other clients
            this.sendPayloadToClients(payload, client.id);
            // By not returning the payload, we cancel this message. It doesn't need to propagate to the app
        }
    }
}
