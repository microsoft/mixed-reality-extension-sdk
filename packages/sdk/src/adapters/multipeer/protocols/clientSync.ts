/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Client, SyncActor } from '..';
import * as MRESDK from '../../..';
import * as Protocols from '../../../protocols';
import * as Payloads from '../../../types/network/payloads';
import { ExportedPromise } from '../../../utils/exportedPromise';

/**
 * @hidden
 * Synchronizes application state with a client
 */
export class ClientSync extends Protocols.Protocol {

    private createActorsInvoked = false;
    private syncAssetsInvoked = false;

    /** @override */
    public get name(): string { return `${this.constructor.name} client ${this.client.id}`; }

    constructor(private client: Client) {
        super(client.conn);
        // Behave like a server-side endpoint (send heartbeats, measure connection quality)
        this.use(new Protocols.ServerPreprocessing());
    }

    /** @override */
    public sendMessage(message: MRESDK.Message, promise?: ExportedPromise) {
        if (message.payload.type === 'heartbeat' ||
            message.payload.type === 'sync-animations' ||
            message.payload.type === 'interpolate-actor') {
            // These messages are part of the synchronization process and so we always let them through.
            super.sendMessage(message, promise);
        } else if (this.syncAssetsInvoked && message.payload.type === 'load-assets') {
            // These messages are load-asset messages. We want to queue these up because we've already
            // passed the `syncAssets` phase of the synchronization process, so we'll need to send these
            // later in the `syncQueuedMessages` phase.
            this.client.queueMessage(message, promise);
        } else if (this.createActorsInvoked && message.payload.type.startsWith('create-')) {
            // These messages are actor creation messages. We want to queue these up because we've already
            // passed the `createActors` phase of the synchronization process, so we'll need to send these
            // later in the `syncQueuedMessages` phase.
            this.client.queueMessage(message, promise);
        } else if (!Client.ShouldIgnorePayloadWhileJoining(message.payload.type)) {
            // A message we should queue for delivery in the `syncQueuedMessages` phase of synchronization.
            this.client.queueMessage(message, promise);
        }
    }

    /** @private */
    public 'recv-sync-request' = async (payload: Payloads.SyncRequest) => {
        if (this.client.session.peerAuthoritative) {
            // Do a quick measurement of connection latency
            const heartbeat = new Protocols.Heartbeat(this);
            await heartbeat.runIterations(10);
            // Sync all the assets
            await this.syncAssets();
            // Sync all the actors
            await this.syncActors();
        }
        // Stop queuing messages
        this.sendMessage = super.sendMessage;
        // Send queued messages
        await this.client.syncQueuedMessages();
        // Notify sync complete
        this.sendPayload({
            type: 'sync-complete',
        } as Payloads.SyncComplete);
        this.stopListening();
        this.emit('protocol.sync-complete');
    }

    private async syncAssets(): Promise<void> {
        this.syncAssetsInvoked = true;
        await Promise.all(
            this.client.session.assetSet.map(
                msg => this.sendAndExpectResponse(msg)));
    }

    private async syncActors() {
        await this.createActors();
        await this.createAnimations();
        this.createBehaviors();
        await this.syncAnimations();
    }

    private createActors(): Promise<any> {
        // Sync actor hierarchies, starting at roots
        const promises = [];
        for (const actor of this.client.session.rootActors) {
            promises.push(this.createActorRecursive(actor));
        }
        // After sending the create* messages we must let future messages through when they're sent, even while this
        // client is still in the process of joining.
        this.createActorsInvoked = true;
        // Wait for all actors to be created
        return Promise.all(promises.filter(promise => !!promise));
    }

    private createAnimations(): Promise<any> {
        const promises = [];
        for (const actor of this.client.session.actors) {
            this.createActorInterpolations(actor);
            promises.push(this.createActorAnimations(actor));
        }
        return Promise.all(promises);
    }

    private createBehaviors(): void {
        for (const actor of this.client.session.actors) {
            this.createActorBehavior(actor);
        }
    }

    private syncAnimations(): Promise<any> {
        // Don't send the sync-animations message to ourselves
        if (this.client.session.authoritativeClient.order === this.client.order) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            const authoritativeClient = this.client.session.authoritativeClient;
            authoritativeClient.sendPayload({
                type: 'sync-animations',
            } as Payloads.SyncAnimations, {
                    resolve: (payload: Payloads.SyncAnimations) => {
                        // We've received the sync-animations payload from the authoritative
                        // client, now pass it to the joining client
                        for (const animationState of payload.animationStates) {
                            // Account for latency on the authoritative peer's connection.
                            animationState.animationTime += authoritativeClient.conn.quality.latencyMs.value / 2000;
                            // Account for latency on the joining peer's connection.
                            animationState.animationTime += this.conn.quality.latencyMs.value / 2000;
                        }
                        super.sendPayload(payload);
                        resolve();
                    }, reject
                });
        });
    }

    private createActorRecursive(actor: Partial<SyncActor>): Promise<void> {
        // Start creating this actor and its children
        return new Promise<void>(async (resolve, reject) => {
            await this.createActor(actor);
            const children = this.client.session.childrenOf(actor.created.message.payload.actor.id);
            if (children.length) {
                const promises: any[] = [];
                for (const child of children) {
                    promises.push(this.createActorRecursive(child));
                }
                await Promise.all(promises.filter(promise => !!promise));
            }
            resolve();
        });
    }

    private createActorBehavior(actor: Partial<SyncActor>) {
        if (actor.behavior) {
            super.sendPayload({
                type: 'set-behavior',
                behaviorType: actor.behavior,
                actorId: actor.actorId
            } as Payloads.SetBehavior);
        }
    }

    private createActor(actor: Partial<SyncActor>) {
        if (actor.created && actor.created.message.payload.type) {
            return this.sendAndExpectResponse(actor.created.message);
        }
    }

    private createActorAnimations(actor: Partial<SyncActor>): Promise<any> {
        const promises = [];
        for (const createAnimation of actor.createdAnimations || []) {
            promises.push(this.sendAndExpectResponse(createAnimation.message));
        }
        return Promise.all(promises);
    }

    private createActorInterpolations(actor: Partial<SyncActor>) {
        for (let activeInterpolation of actor.activeInterpolations || []) {
            // Don't start the interpolations on the new client. They will be started in the syncAnimations phase.
            activeInterpolation = {
                ...activeInterpolation,
                enabled: false
            };
            super.sendPayload(activeInterpolation);
        }
    }

    private sendAndExpectResponse(message: MRESDK.Message) {
        return new Promise<void>((resolve, reject) => {
            super.sendMessage(message, {
                resolve: (replyPayload: any, replyMessage: MRESDK.Message) => {
                    if (this.client.authoritative) {
                        // If this client is authoritative while synchonizing, then it is the only client joined.
                        // In this case we want to send the reply message back to the app since it is expecting it.
                        this.client.session.conn.send(replyMessage);
                    }
                    resolve(replyPayload);
                }, reject
            });
        });
    }
}
