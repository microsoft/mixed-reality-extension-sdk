/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OperationResultCode, Trace } from '..';
import {
    AnimationEvent,
    AnimationKeyframe,
    AnimationState,
    AnimationWrapMode,
} from '../../..';
import { LookAtMode } from '../../lookatMode';
import { PrimitiveDefinition } from '../../primitiveTypes';
import { ActorLike, ColliderType, LightLike, RigidBodyLike, TextLike, UserLike } from '../../runtime';
import { ActionState, BehaviorType } from '../../runtime/behaviors';
import { OperatingModel } from '../operatingModel';
import { SubscriptionOwnerType, SubscriptionType } from '../subscriptionType';

/**
 * @hidden
 */
export type PayloadType
    = 'traces'
    | 'operation-result'
    | 'multi-operation-result'
    | 'handshake'
    | 'handshake-reply'
    | 'handshake-complete'
    | 'heartbeat'
    | 'heartbeat-reply'
    | 'app2engine-rpc'
    | 'engine2app-rpc'
    | 'object-spawned'
    | 'actor-update'
    | 'destroy-actors'
    | 'state-update'
    | 'user-update'
    | 'user-joined'
    | 'user-left'
    | 'perform-action'
    | 'sync-request'
    | 'create-from-library'
    | 'create-from-gltf'
    | 'create-empty'
    | 'create-primitive'
    | 'create-from-prefab'
    | 'actor-update'
    | 'actor-correction'
    | 'destroy-actors'
    | 'state-update'
    | 'sync-complete'
    | 'set-authoritative'
    | 'enable-light'
    | 'enable-rigidbody'
    | 'enable-text'
    | 'update-subscriptions'
    | 'rigidbody-commands'
    | 'rigidbody-move-position'
    | 'rigidbody-move-rotation'
    | 'rigidbody-add-force'
    | 'rigidbody-add-force-at-position'
    | 'rigidbody-add-torque'
    | 'rigidbody-add-relative-torque'
    | 'create-animation'
    | 'start-animation'
    | 'stop-animation'
    | 'reset-animation'
    | 'pause-animation'
    | 'resume-animation'
    | 'sync-animations'
    | 'set-behavior'
    | 'set-primary-behavior'
    | 'update-background-behaviors'
    | 'load-assets'
    | 'assets-loaded'
    ;

/**
 * @hidden
 * Base interface for Payloads.
 */
export type Payload = {
    type: PayloadType;
    traces?: Trace[];
};

/**
 * @hidden
 * Engine to app. Contains a set of trace messages.
 */
export type Traces = Payload & {
    type: 'traces';
};

/**
 * @hidden
 * Engine to app. The result of an operation.
 */
export type OperationResult = Payload & {
    type: 'operation-result';
    resultCode: OperationResultCode;
    message: string;
};

/**
 * @hidden
 * Engine to app. The result of multiple operations.
 */
export type MultiOperationResult = Payload & {
    type: 'multi-operation-result';
    results: OperationResult[];
};

/**
 * @hidden
 * Engine to app. Handshake initiation.
 */
export type Handshake = Payload & {
    type: 'handshake';
};

/**
 * @hidden
 * App to engine. Response to Handshake.
 */
export type HandshakeReply = Payload & {
    type: 'handshake-reply';
    sessionId: string;
    operatingModel: OperatingModel;
};

/**
 * @hidden
 * Engine to app. Handshake process is complete.
 */
export type HandshakeComplete = Payload & {
    type: 'handshake-complete';
};

/**
 * @hidden
 */
export type Heartbeat = Payload & {
    type: 'heartbeat';
};

/**
 * @hidden
 */
export type HeartbeatReply = Payload & {
    type: 'heartbeat-reply';
};

/**
 * @hidden
 */
export type AppToEngineRPC = Payload & {
    type: 'app2engine-rpc';
    userId?: string;
    procName: string;
    args: any[];
};

/**
 * @hidden
 */
export type EngineToAppRPC = Payload & {
    type: 'engine2app-rpc';
    channelName?: string;
    procName: string;
    args: any[];
};

/**
 * @hidden
 */
export type CreateActorCommon = Payload & {
    actor: Partial<ActorLike>;
    subscriptions: SubscriptionType[];
};

/**
 * @hidden
 * App to engine. Request for engine to load a game object from the host library.
 * Response is an ObjectSpawned payload.
 */
export type CreateFromLibrary = CreateActorCommon & {
    type: 'create-from-library';
    resourceId: string;
};

/**
 * @hidden
 * App to engine. Request for engine to load a game object from a glTF file.
 * Response is an ObjectSpawned payload.
 */
export type CreateFromGLTF = CreateActorCommon & {
    type: 'create-from-gltf';
    resourceUrl: string;
    assetName: string;
    colliderType: ColliderType;
};

/**
 * @hidden
 * App to engine. Create an empty game object.
 * Response is an ObjectSpawned payload.
 */
export type CreateEmpty = CreateActorCommon & {
    type: 'create-empty';
};

/**
 * @hidden
 * App to engine. Creates a primitive shape.
 * Response is an ObjectSpawned payload.
 */
export type CreatePrimitive = CreateActorCommon & {
    type: 'create-primitive';
    definition: PrimitiveDefinition;
    addCollider: boolean;
    actor: Partial<ActorLike>;
    subscriptions: SubscriptionType[];
};

/**
 * @hidden
 * Engine to app. Response from LoadFromAssetBundle (and similar).
 */
export type ObjectSpawned = Payload & {
    type: 'object-spawned';
    actors: Array<Partial<ActorLike>>;
    result: OperationResult;
};

/**
 * @hidden
 * Bi-directional. Changed properties of an actor object (sparely populated).
 */
export type ActorUpdate = Payload & {
    type: 'actor-update' | 'actor-correction';
    actor: Partial<ActorLike>;
};

/**
 * @hidden
 * Bi-directional. Command to destroy an actor (and its children).
 */
export type DestroyActors = Payload & {
    type: 'destroy-actors';
    actorIds: string[];
};

/**
 * @hidden
 * Bi-directional. Envelope for multiple update and event payloads (ActorUpdate, etc).
 */
export type StateUpdate = Payload & {
    type: 'state-update';
    payloads: Array<Partial<Payload>>;
};

/**
 * @hidden
 * Engine to app. Engine wants all the application state.
 */
export type SyncRequest = Payload & {
    type: 'sync-request';
};

/**
 * @hidden
 * App to engine. Done sending engine the application state.
 */
export type SyncComplete = Payload & {
    type: 'sync-complete';
};

/**
 * @hidden
 * App to engine. Specific to multi-peer adapter. Set whether the client is "authoritative". The authoritative client
 * sends additional updates back to the app such as rigid body updates and animation events.
 */
export type SetAuthoritative = Payload & {
    type: 'set-authoritative';
    authoritative: boolean;
};

/**
 * @hidden
 * App to engine. The user has joined the app.
 */
export type UserJoined = Payload & {
    type: 'user-joined';
    user: Partial<UserLike>;
};

/**
 * @hidden
 * Engine to app. The user has left the app.
 */
export type UserLeft = Payload & {
    type: 'user-left';
    userId: string;
};

/**
 * @hidden
 * Engine to app. Update to the user's state.
 * Only received for users who have joined the app.
 */
export type UserUpdate = Payload & {
    type: 'user-update';
    user: Partial<UserLike>;
};

/**
 * @hidden
 * Engine to app. The user is performing an action for a behavior.
 */
export type PerformAction = Payload & {
    type: 'perform-action';
    userId: string;
    targetId: string;
    behaviorType: BehaviorType;
    actionName: string;
    actionState: ActionState;
};

/**
 * @hidden
 * App to engine. Set the behavior on the actor with
 * the given actor id.
 */
export type SetBehavior = Payload & {
    type: 'set-behavior';
    actorId: string;
    behaviorType: BehaviorType;
};

/**
 * @hidden
 * App to engine. Add a light to the actor.
 */
export type EnableLight = Payload & {
    type: 'enable-light';
    actorId: string;
    light: Partial<LightLike>;
};

/**
 * @hidden
 * App to engine. Enable text on this actor.
 */
export type EnableText = Payload & {
    type: 'enable-text';
    actorId: string;
    text: Partial<TextLike>;
};

/**
 * @hidden
 * Update subscription flags on the actor
 */
export type UpdateSubscriptions = Payload & {
    type: 'update-subscriptions';
    id: string;
    ownerType: SubscriptionOwnerType;
    adds: SubscriptionType[];
    removes: SubscriptionType[];
};

/**
 * @hidden
 * App to engine. Create an animation and associate it with an actor.
 */
export type CreateAnimation = Payload & {
    type: 'create-animation';
    actorId: string;
    animationName: string;
    keyframes: AnimationKeyframe[];
    events: AnimationEvent[];
    wrapMode: AnimationWrapMode;
};

/**
 * @hidden
 * App to engine. Starts an animation.
 */
export type StartAnimation = Payload & {
    type: 'start-animation';
    actorId: string;
    animationName: string;
    animationTime?: number;
    paused?: boolean;
    hasRootMotion?: boolean;
};

/**
 * @hidden
 * App to engine. Stops an animation.
 */
export type StopAnimation = Payload & {
    type: 'stop-animation';
    actorId: string;
    animationName: string;
    animationTime?: number;
};

/**
 * @hidden
 * App to engine. Resets an animation.
 */
export type ResetAnimation = Payload & {
    type: 'reset-animation';
    actorId: string;
    animationName: string;
};

/**
 * @hidden
 * App to engine. Pauses an animation.
 */
export type PauseAnimation = Payload & {
    type: 'pause-animation';
    actorId: string;
    animationName: string;
};

/**
 * @hidden
 * App to engine. Resumes an animation.
 */
export type ResumeAnimation = Payload & {
    type: 'resume-animation';
    actorId: string;
    animationName: string;
};

/**
 * @hidden
 * Bidirectional. Sync animation state.
 */
export type SyncAnimations = Payload & {
    type: 'sync-animations';
    animationStates: AnimationState[];
};

/**
 * @hidden
 * App to engine. Instruct the actor to face another actor or user.
 */
export type LookAt = Payload & {
    type: 'look-at';
    actorId: string;
    targetId: string;
    lookAtMode: LookAtMode;
};
