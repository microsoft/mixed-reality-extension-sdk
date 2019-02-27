/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';

import {
    ActionEvent,
    Actor,
    ActorLike,
    ActorSet,
    AnimationWrapMode,
    Asset,
    AssetLike,
    BehaviorType,
    CollisionEvent,
    Context,
    CreateAnimationOptions,
    LookAtMode,
    PrimitiveDefinition,
    SetAnimationStateOptions,
    SubscriptionType,
    User,
    UserLike,
    UserSet,
} from '../..';

import {
    ActorUpdate,
    AssetUpdate,
    CollisionEventType,
    CreateActorCommon,
    CreateAnimation,
    CreateColliderType,
    CreateEmpty,
    CreateFromGltf,
    CreateFromLibrary,
    CreateFromPrefab,
    CreatePrimitive,
    DestroyActors,
    InterpolateActor,
    ObjectSpawned,
    OperationResult,
    Payload,
    RigidBodyCommands,
    SetAnimationState,
    SetBehavior,
    UpdateCollisionEventSubscriptions,
    UpdateSubscriptions,
} from '../network/payloads';

import { log } from '../../log';
import * as Protocols from '../../protocols';
import { Execution } from '../../protocols/execution';
import { Handshake } from '../../protocols/handshake';
import resolveJsonValues from '../../utils/resolveJsonValues';
import { createForwardPromise, ForwardPromise } from '../forwardPromise';
import { OperatingModel } from '../network/operatingModel';
import { Patchable } from '../patchable';

/**
 * @hidden
 */
export class InternalContext {
    public actorSet: ActorSet = {};
    public userSet: UserSet = {};
    public protocol: Protocols.Protocol;
    public interval: NodeJS.Timer;
    public generation = 0;
    public prevGeneration = 0;
    // tslint:disable-next-line:variable-name
    public __rpc: any;

    constructor(public context: Context) {
        // Handle connection close events.
        this.onClose = this.onClose.bind(this);
        this.context.conn.on('close', this.onClose);
    }

    public CreateEmpty(options?: {
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        options = { ...options };
        options = {
            subscriptions: [],
            ...options,
            actor: {
                ...options.actor,
                id: UUID()
            }
        };
        const payload = {
            ...options,
            type: 'create-empty',
        } as CreateEmpty;
        return this.createActorFromPayload(payload);
    }

    public CreateFromGltf(options: {
        resourceUrl: string,
        assetName?: string,
        colliderType?: CreateColliderType,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        options = { ...options };
        options = {
            subscriptions: [],
            colliderType: 'none',
            ...options,
            actor: {
                ...options.actor,
                id: UUID()
            }
        };
        const payload = {
            ...options,
            type: 'create-from-gltf'
        } as CreateFromGltf;
        return this.createActorFromPayload(payload);
    }

    public CreateFromLibrary(options: {
        resourceId: string,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        options = { ...options };
        options = {
            subscriptions: [],
            ...options,
            actor: {
                ...options.actor,
                id: UUID()
            }
        };
        const payload = {
            ...options,
            type: 'create-from-library'
        } as CreateFromLibrary;
        return this.createActorFromPayload(payload);
    }

    public CreatePrimitive(options: {
        definition: PrimitiveDefinition,
        addCollider?: boolean,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        options = { ...options };
        options = {
            subscriptions: [],
            addCollider: false,
            ...options,
            actor: {
                ...options.actor,
                id: UUID()
            }
        };
        const payload = {
            ...options,
            type: 'create-primitive'
        } as CreatePrimitive;
        return this.createActorFromPayload(payload);
    }

    public CreateFromPrefab(options: {
        prefabId: string,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        options = { ...options };
        options = {
            subscriptions: [],
            ...options,
            actor: {
                ...options.actor,
                id: UUID()
            }
        };
        return this.createActorFromPayload({
            ...options,
            type: 'create-from-prefab'
        } as CreateFromPrefab);
    }

    private createActorFromPayload(payload: CreateActorCommon): ForwardPromise<Actor> {
        // Resolve by-reference values now, ensuring they won't change in the
        // time between now and when this message is actually sent.
        payload.actor = resolveJsonValues(payload.actor);
        // Create the actor locally.
        this.updateActors(payload.actor);
        // Get a reference to the new actor.
        const actor = this.context.actor(payload.actor.id);
        const parent = actor.parent;
        const wait = parent ? parent.created() : Promise.resolve();

        // If we have a parent, make sure it is done getting created first.
        return createForwardPromise<Actor>(actor, new Promise((resolve, reject) => {
            wait.then(() => {
                // Send a message to the engine to instantiate the object.
                this.protocol.sendPayload(
                    payload,
                    {
                        resolve: (replyPayload: ObjectSpawned | OperationResult) => {
                            this.protocol.recvPayload(replyPayload);
                            let success: boolean;
                            let message: string;
                            if (replyPayload.type === 'operation-result') {
                                success = replyPayload.resultCode !== 'error';
                                message = replyPayload.message;
                            } else {
                                success = replyPayload.result.resultCode !== 'error';
                                message = replyPayload.result.message;

                                for (const createdActorLike of replyPayload.actors) {
                                    const createdActor = this.actorSet[createdActorLike.id];
                                    if (createdActor) {
                                        createdActor.internal.notifyCreated(success, replyPayload.result.message);
                                    }
                                }
                            }

                            if (success) {
                                resolve(actor);
                            } else {
                                reject(message);
                            }
                        },
                        reject
                    });
            }).catch((reason: any) => {
                reject(`Failed to instantiate actor ${actor.id}. ${(reason || '').toString()}`.trim());
                // TODO: Remove actor from context?
            });
        }));
    }

    public createAnimation(actorId: string, animationName: string, options: CreateAnimationOptions) {
        const actor = this.actorSet[actorId];
        if (!actor) {
            return Promise.reject(`Failed to create animation. Actor ${actorId} not found`);
        }
        options = {
            wrapMode: AnimationWrapMode.Once,
            ...options
        };
        // Resolve by-reference values now, ensuring they won't change in the
        // time between now and when this message is actually sent.
        options.keyframes = resolveJsonValues(options.keyframes);
        // Enqueue a placeholder promise to indicate the operation is in progress.
        actor.internal.enqueueCreateAnimationPromise(
            animationName, {
                resolve: () => { /* empty */ },
                reject: () => { /* empty */ },
            });
        return new Promise<void>((resolve, reject) => {
            actor.created().then(() => {
                // TODO: Reject promise if send() fails
                this.protocol.sendPayload({
                    type: 'create-animation',
                    actorId,
                    animationName,
                    ...options
                } as CreateAnimation, {
                        resolve: (replyPayload: OperationResult) => {
                            this.protocol.recvPayload(replyPayload);
                            const success = replyPayload.resultCode !== 'error';
                            const message = replyPayload.message;
                            actor.internal.notifyAnimationCreated(animationName, success, message);
                            if (success) {
                                resolve();
                            } else {
                                reject(message);
                            }
                        },
                        reject: (reason?: any) => {
                            actor.internal.notifyAnimationCreated(animationName, false, reason);
                            reject(reason);
                        }
                    });
            }).catch((reason) => {
                reject(`Failed to create animation: ${(reason || '').toString()}`.trim());
            });
        });
    }

    public setAnimationState(
        actorId: string,
        animationName: string,
        state: SetAnimationStateOptions
    ) {
        const actor = this.actorSet[actorId];
        if (actor) {
            actor.created().then(() => {
                actor.internal.animationCreated(animationName)
                    .then(() => this.protocol.sendPayload({
                        type: 'set-animation-state',
                        actorId,
                        animationName,
                        state
                    } as SetAnimationState))
                    .catch((reason) => log.error('app', reason));
            })
            .catch((reason) => log.error('app', reason));
        } else {
            log.error('app', `Failed to set animation state on ${animationName}. Actor ${actorId} not found.`);
        }
    }

    public animateTo(
        actorId: string,
        value: Partial<ActorLike>,
        duration: number,
        curve: number[],
    ) {
        const actor = this.actorSet[actorId];
        if (!actor) {
            return Promise.reject(`Failed animateTo. Actor ${actorId} not found`);
        } else if (!Array.isArray(curve) || curve.length !== 4) {
            return Promise.reject('`curve` parameter must be an array of four numbers. \
            Try passing one of the predefined curves from `AnimationEaseCurves`');
        } else {
            return new Promise<void>((resolve, reject) => {
                actor.created().then(() => {
                    this.protocol.sendPayload({
                        type: 'interpolate-actor',
                        actorId,
                        animationName: UUID(),
                        value,
                        duration,
                        curve,
                        enabled: true
                    } as InterpolateActor, { resolve, reject });
                }).catch((reason: any) => {
                    log.error('app', `Failed animateTo. Actor ${actor.id}. ${(reason || '').toString()}`.trim());
                });
            });
        }
    }

    /* TODO: Delete enable-collider payload and implement via patching mechanism.

    public enableCollider(
        actorId: string,
        colliderType: 'box' | 'sphere',
        collisionLayer: CollisionLayer,
        isTrigger: boolean,
        center: Vector3Like,
        size: number | Vector3Like
    ): ForwardPromise<Collider> {
        const actor = this.actorSet[actorId];
        if (!actor) {
            return Promise.reject(`Failed enable collider. Actor ${actorId} not found`);
        } else {
            // Resolve by-reference values now, ensuring they won't change in the
            // time between now and when this message is actually sent.
            center = resolveJsonValues(center);
            size = resolveJsonValues(size);
            return createForwardPromise<Collider>(actor.collider, new Promise((resolve, reject) => {
                actor.created().then(() => {
                    let colliderPayload = {
                        type: 'enable-collider',
                        actorId,
                    } as EnableCollider;

                    switch (colliderType) {
                        case 'box':
                            colliderPayload = {
                                ...colliderPayload,
                                collider: {
                                    enabled: true,
                                    isTrigger,
                                    collisionLayer,
                                    colliderParams: {
                                        colliderType: 'box',
                                        center,
                                        size: size as Partial<Vector3Like>
                                    } as BoxColliderParams
                                } as ColliderLike
                            };
                            break;
                        case 'sphere':
                            colliderPayload = {
                                ...colliderPayload,
                                collider: {
                                    enabled: true,
                                    isTrigger,
                                    collisionLayer,
                                    colliderParams: {
                                        colliderType: 'sphere',
                                        center,
                                        radius: size as number
                                    } as SphereColliderParams
                                } as ColliderLike
                            };
                            break;
                        default:
                            reject(
                                'Trying to enable a collider on the actor with an invalid collider type.' +
                                `Type given is ${colliderType}`);
                    }

                    this.protocol.sendPayload(colliderPayload, {
                        resolve: (payload: OperationResult) => {
                            this.protocol.recvPayload(payload);
                            if (payload.resultCode === 'error') {
                                reject(payload.message);
                            } else {
                                resolve(actor.collider);
                            }
                        },
                        reject
                    });
                }).catch((reason: any) => {
                    reject(`Failed enable collider on actor ${actor.id}. ${(reason || '').toString()}`.trim());
                });
            }));
        }
    }
    */
    public updateSubscriptions(
        actorId: string,
        options: {
            adds?: SubscriptionType | SubscriptionType[],
            removes?: SubscriptionType | SubscriptionType[]
        }
    ) {
        const actor = this.actorSet[actorId];
        if (actor) {
            actor.created().then(() => {
                this.protocol.sendPayload({
                    type: 'update-subscriptions',
                    id: actorId,
                    adds: options.adds,
                    removes: options.removes
                } as UpdateSubscriptions);
            }).catch((reason: any) => {
                log.error('app', `Failed to update subscriptions on actor ${actor.id}.`, reason);
            });
        } else {
            log.error('app', `Failed to update subscriptions. Actor ${actorId} not found.`);
        }
    }

    public updateCollisionEventSubscriptions(
        actorId: string,
        options: {
            adds?: CollisionEventType | CollisionEventType[],
            removes?: CollisionEventType | CollisionEventType[]
        }
    ) {
        const actor = this.actorSet[actorId];
        if (actor) {
            actor.created().then(() => {
                this.protocol.sendPayload({
                    type: 'update-collision-event-subscriptions',
                    actorId,
                    adds: options.adds,
                    removes: options.removes
                } as UpdateCollisionEventSubscriptions);
            }).catch((reason: any) => {
                log.error('app', `Failed to update collision event subscriptions on actor ${actor.id}.`, reason);
            });
        } else {
            log.error('app', `Failed to update collision event subscriptions. Actor ${actorId} not found.`);
        }
    }

    public async startListening() {
        try {
            // Startup the handshake protocol.
            const handshake = this.protocol =
                new Handshake(this.context.conn, this.context.sessionId, OperatingModel.ServerAuthoritative);
            await handshake.run();

            // Switch to execution protocol.
            const execution = this.protocol = new Execution(this.context);

            this.updateActors = this.updateActors.bind(this);
            this.localDestroyActors = this.localDestroyActors.bind(this);
            this.userJoined = this.userJoined.bind(this);
            this.userLeft = this.userLeft.bind(this);
            this.updateUser = this.updateUser.bind(this);
            this.performAction = this.performAction.bind(this);
            this.receiveRPC = this.receiveRPC.bind(this);
            this.collisionEventRaised = this.collisionEventRaised.bind(this);
            this.setAnimationStateEventRaised = this.setAnimationStateEventRaised.bind(this);

            execution.on('protocol.update-actors', this.updateActors);
            execution.on('protocol.destroy-actors', this.localDestroyActors);
            execution.on('protocol.user-joined', this.userJoined);
            execution.on('protocol.user-left', this.userLeft);
            execution.on('protocol.update-user', this.updateUser);
            execution.on('protocol.perform-action', this.performAction);
            execution.on('protocol.receive-rpc', this.receiveRPC);
            execution.on('protocol.collision-event-raised', this.collisionEventRaised);
            execution.on('protocol.set-animation-state', this.setAnimationStateEventRaised);

            // Startup the execution protocol
            execution.startListening();
        } catch (e) {
            log.error('app', e);
        }
    }

    public start() {
        if (!this.interval) {
            this.interval = setInterval(() => this.update(), 0);
            this.context.emitter.emit('started');
        }
    }

    public stop() {
        try {
            if (this.interval) {
                this.protocol.stopListening();
                clearInterval(this.interval);
                this.interval = undefined;
                this.context.emitter.emit('stopped');
                this.context.emitter.removeAllListeners();
            }
        } catch { }
    }

    public incrementGeneration() {
        this.generation++;
    }

    public update() {
        // Early out if no state changes occurred.
        if (this.generation === this.prevGeneration) {
            return;
        }

        this.prevGeneration = this.generation;

        const syncObjects = [
            ...Object.values(this.actorSet),
            ...Object.values(this.context.assetManager.assets)
        ] as Array<Patchable<any>>;

        for (const patchable of syncObjects) {
            const patch = patchable.internal.getPatchAndReset();
            if (!patch) {
                continue;
            }

            if (patchable instanceof Actor) {
                this.protocol.sendPayload({
                    type: 'actor-update',
                    actor: patch as ActorLike
                } as ActorUpdate);
            } else if (patchable instanceof Asset) {
                this.protocol.sendPayload({
                    type: 'asset-update',
                    asset: patch as AssetLike
                } as AssetUpdate);
            }
        }
    }

    public sendDestroyActors(actorIds: string[]) {
        if (actorIds.length) {
            this.protocol.sendPayload({
                type: 'destroy-actors',
                actorIds,
            } as DestroyActors);
        }
    }

    public updateActors(sactors: Partial<ActorLike> | Array<Partial<ActorLike>>) {
        if (!sactors) {
            return;
        }
        if (!Array.isArray(sactors)) {
            sactors = [sactors];
        }
        const newActorIds: string[] = [];
        // Instantiate and store each actor.
        sactors.forEach(sactor => {
            const isNewActor = !this.actorSet[sactor.id];
            const actor = isNewActor ? Actor.alloc(this.context, sactor.id) : this.actorSet[sactor.id];
            this.actorSet[sactor.id] = actor;
            actor.copy(sactor);
            if (isNewActor) {
                newActorIds.push(actor.id);
            }
        });
        newActorIds.forEach(actorId => {
            const actor = this.actorSet[actorId];
            this.context.emitter.emit('actor-created', actor);
        });
    }

    public sendPayload(payload: Payload): void {
        this.protocol.sendPayload(payload);
    }

    public receiveRPC(procName: string, channelName: string, args: any[]) {
        this.context.emitter.emit('context.receive-rpc', procName, channelName, args);
    }

    public onClose = () => {
        this.stop();
    }

    public userJoined(suser: Partial<UserLike>) {
        if (!this.userSet[suser.id]) {
            const user = this.userSet[suser.id] = new User(this.context, suser.id);
            user.copy(suser);
            this.context.emitter.emit('user-joined', user);
        }
    }

    public userLeft(userId: string) {
        const user = this.userSet[userId];
        if (user) {
            delete this.userSet[userId];
            this.context.emitter.emit('user-left', user);
        }
    }

    public updateUser(suser: Partial<UserLike>) {
        const isNewUser = !this.userSet[suser.id];
        const user = isNewUser ? new User(this.context, suser.id) : this.userSet[suser.id];
        user.copy(suser);
        this.userSet[user.id] = user;
        if (isNewUser) {
            this.context.emitter.emit('user-joined', user);
        } else {
            this.context.emitter.emit('user-updated', user);
        }
    }

    public performAction(actionEvent: ActionEvent) {
        const user = this.userSet[actionEvent.userId];
        if (user) {
            const targetActor = this.actorSet[actionEvent.targetId];
            if (targetActor) {
                targetActor.internal.performAction(actionEvent);
            }
        }
    }

    public collisionEventRaised(collisionEvent: CollisionEvent) {
        const actor = this.actorSet[collisionEvent.colliderOwnerId];
        if (actor) {
            actor.internal.collisionEventRaised(
                collisionEvent.collisionEventType,
                collisionEvent.collisionData);
        }
    }

    public setAnimationStateEventRaised(actorId: string, animationName: string, state: SetAnimationStateOptions) {
        const actor = this.context.actor(actorId);
        if (actor) {
            actor.internal.setAnimationStateEventRaised(animationName, state);
        }
    }

    public localDestroyActors(actorIds: string[]) {
        for (const actorId of actorIds) {
            if (this.actorSet[actorId]) {
                this.localDestroyActor(this.actorSet[actorId]);
            }
        }
    }

    public localDestroyActor(actor: Actor) {
        // Collect this actor and all the children recursively
        const actorIds: string[] = [];
        // Recursively destroy children first
        (actor.children || []).forEach(child => {
            this.localDestroyActor(child);
        });
        // Remove actor from _actors
        delete this.actorSet[actor.id];
        // Raise event
        this.context.emitter.emit('actor-destroyed', actor);
    }

    public destroyActor(actorId: string) {
        const actor = this.actorSet[actorId];
        if (actor) {
            // Tell engine to destroy the actor (will destroy all children too)
            this.sendDestroyActors([actorId]);
            // Clean up the actor locally
            this.localDestroyActor(actor);
        }
    }

    public sendRigidBodyCommand(actorId: string, payload: Payload) {
        this.protocol.sendPayload({
            type: 'rigidbody-commands',
            actorId,
            commandPayloads: [payload]
        } as RigidBodyCommands);
    }

    public setBehavior(actorId: string, newBehaviorType: BehaviorType) {
        const actor = this.actorSet[actorId];
        if (actor) {
            actor.created().then(() => {
                this.protocol.sendPayload({
                    type: 'set-behavior',
                    actorId,
                    behaviorType: newBehaviorType || 'none'
                } as SetBehavior);
            }).catch((reason: any) => {
                log.error('app', `Failed to set behavior on actor ${actor.id}.`, reason);
            });
        }
    }
}
