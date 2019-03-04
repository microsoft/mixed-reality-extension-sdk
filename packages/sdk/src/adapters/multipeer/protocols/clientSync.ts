/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';
import { Client, MissingRule, Rules, SyncActor } from '..';
import { Message } from '../../..';
import { log } from '../../../log';
import * as Protocols from '../../../protocols';
import { SetSoundStateOptions, SoundCommand } from '../../../sound';
import * as Payloads from '../../../types/network/payloads';
import { ExportedPromise } from '../../../utils/exportedPromise';

// tslint:disable:object-literal-key-quotes no-console

/**
 * @hidden
 */
export type SynchronizationStage =
    'always' |
    'load-assets' |
    'create-actors' |
    'active-sound-instances' |
    'create-animations' |
    'sync-animations' |
    'set-behaviors' |
    'never';

/**
 * @hidden
 * Synchronizes application state with a client.
 */
export class ClientSync extends Protocols.Protocol {
    private inProgressStages: SynchronizationStage[] = [];
    private completedStages: SynchronizationStage[] = [];

    // The order of synchronization stages.
    private sequence: SynchronizationStage[] = [
        'load-assets',
        'create-actors',
        'active-sound-instances',
        'set-behaviors',
        'create-animations',
        'sync-animations',
    ];

    /** @override */
    public get name(): string { return `${this.constructor.name} client ${this.client.id.substr(0, 8)}`; }

    constructor(private client: Client) {
        super(client.conn);
        // Behave like a server-side endpoint (send heartbeats, measure connection quality)
        this.use(new Protocols.ServerPreprocessing());
    }

    /**
     * @override
     * Handle the outgoing message according to the synchronization rules specified for this payload.
     */
    public sendMessage(message: Message, promise?: ExportedPromise) {
        message.id = message.id || UUID();
        const handling = this.handlingForMessage(message);
        // tslint:disable-next-line:switch-default
        switch (handling) {
            case 'allow': {
                super.sendMessage(message, promise);
                break;
            }
            case 'queue': {
                this.client.queueMessage(message, promise);
                break;
            }
            case 'ignore': {
                break;
            }
            case 'error': {
                // tslint:disable-next-line: max-line-length
                console.error(`[ERROR] ${this.name}: Invalid message for send during synchronization stage: ${message.payload.type}. In progress: ${this.inProgressStages.join(',')}. Complete: ${this.completedStages.join(',')}.`);
            }
        }
    }

    private handlingForMessage(message: Message) {
        const rule = Rules[message.payload.type] || MissingRule;
        let handling = rule.synchronization.before;
        if (this.isStageComplete(rule.synchronization.stage)) {
            handling = rule.synchronization.after;
        } else if (this.isStageInProgress(rule.synchronization.stage)) {
            handling = rule.synchronization.during;
        }
        return handling;
    }

    private isStageComplete(stage: SynchronizationStage) {
        return this.completedStages.includes(stage);
    }

    private isStageInProgress(stage: SynchronizationStage) {
        return this.inProgressStages.includes(stage);
    }

    private beginStage(stage: SynchronizationStage) {
        log.debug('network', `${this.name} - begin stage '${stage}'`);
        this.inProgressStages = [...this.inProgressStages, stage];
    }

    private completeStage(stage: SynchronizationStage) {
        log.debug('network', `${this.name} - complete stage '${stage}'`);
        this.inProgressStages = this.inProgressStages.filter(item => item !== stage);
        this.completedStages = [...this.completedStages, stage];
    }

    private async executeStage(stage: SynchronizationStage) {
        const handler = (this as any)[`stage:${stage}`];
        if (handler) {
            await handler(); // Allow exception to propagate.
        } else {
            console.error(`[ERROR] ${this.name}: No handler for stage ${stage}!`);
        }
    }

    /**
     * @override
     */
    public async run() {
        try {
            this.startListening();
            this.beginStage('always');
            if (this.client.session.peerAuthoritative) {
                // Run all the synchronization stages.
                for (const stage of this.sequence) {
                    this.beginStage(stage);
                    await this.executeStage(stage);
                    this.completeStage(stage);
                    await this.sendQueuedMessages();
                }
            }
            this.completeStage('always');
            // Notify the client we're done synchronizing.
            this.sendPayload({ type: 'sync-complete' } as Payloads.SyncComplete);
            // Send all remaining queued messages.
            await this.sendQueuedMessages();
            this.resolve();
        } catch (e) {
            this.reject(e);
        }
    }

    /**
     * @hidden
     * Driver for the `load-assets` synchronization stage.
     */
    public 'stage:load-assets' = async () => {
        // Send all cached load-assets messages.
        await Promise.all(
            this.client.session.assets.map(
                message => this.sendAndExpectResponse(message)));
        // Send all cached asset-update messages.
        this.client.session.assetUpdates.map(
            payload => this.sendMessage({ payload }));
    }

    /**
     * @hidden
     * Driver for the `create-actors` synchronization stage.
     */
    public 'stage:create-actors' = async () => {
        // Sync cached create-actor hierarchies, starting at roots.
        await Promise.all(
            this.client.session.rootActors.map(
                syncActor => this.createActorRecursive(syncActor)));
    }

    /**
     * @hidden
     * Driver for the `set-behaviors` synchronization stage.
     */
    public 'stage:set-behaviors' = async () => {
        // Send all cached set-behavior messages.
        this.client.session.actors.map(syncActor => this.createActorBehavior(syncActor));
        return Promise.resolve();
    }

    /**
     * @hidden
     * Driver for the `active-sound-instances` synchronization stage.
     */
    public 'stage:active-sound-instances' = async () => {
        // Send all cached set-behavior messages.
        await Promise.all([
            this.client.session.actors.map(syncActor => this.activeSoundInstances(syncActor))]);
    }
    /**
     * @hidden
     * Driver for the `create-animations` synchronization stage.
     */
    public 'stage:create-animations' = async () => {
        // Send all cached interpolate-actor and create-animation messages.
        this.client.session.actors.map(syncActor => this.createActorInterpolations(syncActor));
        await Promise.all([
            this.client.session.actors.map(syncActor => this.createActorAnimations(syncActor))]);
    }

    /**
     * @hidden
     * Driver for the `sync-animations` synchronization stage.
     */
    public 'stage:sync-animations' = async () => {
        const authoritativeClient = this.client.session.authoritativeClient;
        if (!authoritativeClient) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            // Request the current state of all animations from the authoritative client.
            // TODO: Improve this (don't rely on a peer).
            authoritativeClient.sendPayload({
                type: 'sync-animations',
            } as Payloads.SyncAnimations, {
                    resolve: (payload: Payloads.SyncAnimations) => {
                        // We've received the sync-animations payload from the authoritative
                        // client, now pass it to the joining client.
                        for (const animationState of payload.animationStates) {
                            // Account for latency on the authoritative peer's connection.
                            animationState.state.time += authoritativeClient.conn.quality.latencyMs.value / 2000;
                            // Account for latency on the joining peer's connection.
                            animationState.state.time += this.conn.quality.latencyMs.value / 2000;
                        }
                        // Pass with an empty reply handler to account for an edge case that will go away once
                        // animation synchronization is refactored.
                        super.sendPayload(payload);
                        resolve();
                    }, reject
                });
        });
    }

    private createActorRecursive(actor: Partial<SyncActor>) {
        // Start creating this actor and its creatable children.
        return new Promise<void>(async (resolve, reject) => {
            await this.createActor(actor); // Allow exception to propagate.
            // const children = this.client.session.childrenOf(actor.created.message.payload.actor.id);
            const children = this.client.session.creatableChildrenOf(actor.created.message.payload.actor.id);
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

    private activeSoundInstances(actor: Partial<SyncActor>) {
        return Promise.all([
            (actor.activeSoundInstances || [])
                .map(activeSoundInstance => {
                    // TODO This sound tweaking should ideally be done on the client, because then it can consider the
                    // time it takes for packet to arrive. This is needed for optimal timing .
                    const targetTime = Date.now() / 1000.0;
                    if (activeSoundInstance.message.payload.options.paused !== true) {
                        let timeOffset = (targetTime - activeSoundInstance.basisTime);
                        if (activeSoundInstance.message.payload.options.pitch !== undefined) {
                            timeOffset *= Math.pow(2.0, (activeSoundInstance.message.payload.options.pitch / 12.0));
                        }
                        if (activeSoundInstance.message.payload.startTimeOffset === undefined) {
                            activeSoundInstance.message.payload.startTimeOffset = 0.0;
                        }
                        activeSoundInstance.message.payload.startTimeOffset += timeOffset;
                    }
                    return this.sendAndExpectResponse(activeSoundInstance.message);
                })
        ]);
    }

    private createActorAnimations(actor: Partial<SyncActor>) {
        return Promise.all([
            (actor.createdAnimations || [])
                .map(createdAnimation => this.sendAndExpectResponse(createdAnimation.message))
        ]);
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

    private sendAndExpectResponse(message: Message) {
        return new Promise<void>((resolve, reject) => {
            super.sendMessage(message, {
                resolve: (replyPayload: any, replyMessage: Message) => {
                    this.client.session.conn.send(replyMessage);
                    resolve(replyPayload);
                }, reject
            });
        });
    }

    public async sendQueuedMessages() {
        // 1. Get the subset of queued messages that can be sent now.
        // 2. Send the messages and wait for expected replies.
        // 3. Repeat until no more messages to send.
        do {
            const queuedMessages = this.client.filterQueuedMessages((queuedMessage) => {
                const message = queuedMessage.message;
                const handling = this.handlingForMessage(message);
                return handling === 'allow';
            });
            if (!queuedMessages.length) {
                break;
            }
            for (const queuedMessage of queuedMessages) {
                this.sendMessage(queuedMessage.message, queuedMessage.promise);
            }
            await this.drainPromises();
        } while (true);
    }
}
