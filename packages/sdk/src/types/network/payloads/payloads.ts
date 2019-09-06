/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OperationResultCode, Trace } from '..';
import { CreateAnimationOptions, MediaCommand, SetAnimationStateOptions, SetMediaStateOptions } from '../../..';
import { PrimitiveDefinition } from '../../primitiveTypes';
import { ActorLike, ColliderType, TransformLike, UserLike } from '../../runtime';
import { ActionState, BehaviorType } from '../../runtime/behaviors';
import { OperatingModel } from '../operatingModel';
import { AssetPayloadType } from './assets';
import { SyncPayloadType } from './sync';

/**
 * @hidden
 * *** KEEP ENTRIES SORTED ***
 */
export type PayloadType
	= AssetPayloadType
	| SyncPayloadType
	| 'actor-correction'
	| 'actor-update'
	| 'app2engine-rpc'
	| 'collision-event-raised'
	| 'create-animation'
	| 'create-empty'
	| 'create-from-library'
	| 'destroy-actors'
	| 'dialog-response'
	| 'engine2app-rpc'
	| 'handshake'
	| 'handshake-complete'
	| 'handshake-reply'
	| 'heartbeat'
	| 'heartbeat-reply'
	| 'interpolate-actor'
	| 'multi-operation-result'
	| 'object-spawned'
	| 'operation-result'
	| 'perform-action'
	| 'rigidbody-add-force'
	| 'rigidbody-add-force-at-position'
	| 'rigidbody-add-relative-torque'
	| 'rigidbody-add-torque'
	| 'rigidbody-commands'
	| 'rigidbody-move-position'
	| 'rigidbody-move-rotation'
	| 'set-animation-state'
	| 'set-authoritative'
	| 'set-behavior'
	| 'set-media-state'
	| 'show-dialog'
	| 'sync-animations'
	| 'sync-complete'
	| 'sync-request'
	| 'traces'
	| 'trigger-event-raised'
	| 'user-joined'
	| 'user-left'
	| 'user-update'
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
 * App to engine. Create an empty game object.
 * Response is an ObjectSpawned payload.
 */
export type CreateEmpty = CreateActorCommon & {
	type: 'create-empty';
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
 * Bi-directional. Changed properties of an actor object (sparsely populated).
 */
export type ActorUpdate = Payload & {
	type: 'actor-update';
	actor: Partial<ActorLike>;
};

/**
 * @hidden
 * Engine to app.  Actor correction that should be lerped on the other clients.
 */
export type ActorCorrection = Payload & {
	type: 'actor-correction';
	actorId: string;
	appTransform: TransformLike;
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
 * App to engine. Create an animation and associate it with an actor.
 */
export type CreateAnimation = Payload & CreateAnimationOptions & {
	type: 'create-animation';
	actorId: string;
	animationName: string;
};

/**
 * @hidden
 * App to engine. Sets animation state.
 */
export type SetAnimationState = Payload & {
	type: 'set-animation-state';
	actorId: string;
	animationName: string;
	state: SetAnimationStateOptions;
};

/**
 * @hidden
 * Bidirectional. Sync animation state.
 */
export type SyncAnimations = Payload & {
	type: 'sync-animations';
	animationStates: SetAnimationState[];
};

/**
 * @hidden
 * App to engine. Starts playing a sound.
 */
export type SetMediaState = Payload & {
	type: 'set-media-state';
	id: string;
	actorId: string;
	mediaAssetId: string;
	mediaCommand: MediaCommand;
	options: SetMediaStateOptions;

};

/**
 * @hidden
 * App to engine. Interpolate the actor's transform.
 */
export type InterpolateActor = Payload & {
	type: 'interpolate-actor';
	actorId: string;
	animationName: string;
	value: Partial<ActorLike>;
	duration: number;
	curve: number[];
	enabled: boolean;
};

/**
 * @hidden
 * App to engine. Prompt to show modal dialog box.
 */
export type ShowDialog = Payload & {
	type: 'show-dialog';
	dialogId: string;
	text: string;
	buttons: string[];
	recipients?: string[];
	icon?: string;
	input?: boolean;
};

/**
 * @hidden
 * Engine to app. Acknowledgement of modal dialog.
 */
export type DialogResponse = Payload & {
	type: 'dialog-response';
	dialogId: string;
	userId: string;
	button: boolean;
	text?: string;
}
