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
	AssetContainer,
	AssetContainerIterable,
	AssetLike,
	BehaviorType,
	ColliderType,
	CollisionEvent,
	Context,
	CreateAnimationOptions,
	MediaCommand,
	SetAnimationStateOptions,
	SetMediaStateOptions,
	TriggerEvent,
	User,
	UserLike,
	UserSet,
} from '../..';

import {
	ActorUpdate,
	AssetUpdate,
	CreateActorCommon,
	CreateAnimation,
	CreateEmpty,
	CreateFromLibrary,
	CreateFromPrefab,
	DestroyActors,
	InterpolateActor,
	ObjectSpawned,
	OperationResult,
	Payload,
	RigidBodyCommands,
	SetAnimationState,
	SetBehavior,
	SetMediaState,
	UserUpdate,
} from '../network/payloads';

import { ZeroGuid } from '../../constants';
import { log } from '../../log';
import * as Protocols from '../../protocols';
import { Execution } from '../../protocols/execution';
import { Handshake } from '../../protocols/handshake';
import resolveJsonValues from '../../utils/resolveJsonValues';
import safeGet from '../../utils/safeAccessPath';
import { OperatingModel } from '../network/operatingModel';
import { Patchable } from '../patchable';
import { MediaInstance } from '../runtime/mediaInstance';

/**
 * @hidden
 */
export class InternalContext {
	public actorSet: ActorSet = {};
	public userSet: UserSet = {};
	public userGroupMapping: { [id: string]: number } = { default: 1 };
	public assetContainers = new Set<AssetContainer>();
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
		actor?: Partial<ActorLike>
	}): Actor {
		options = {
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

	public CreateFromLibrary(options: {
		resourceId: string,
		actor?: Partial<ActorLike>
	}): Actor {
		options = {
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

	public CreateFromPrefab(options: {
		prefabId: string,
		actor?: Partial<ActorLike>
	}): Actor {
		options = {
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

	private createActorFromPayload(payload: CreateActorCommon): Actor {
		// Resolve by-reference values now, ensuring they won't change in the
		// time between now and when this message is actually sent.
		payload.actor = Actor.sanitize(payload.actor);
		// Create the actor locally.
		this.updateActors(payload.actor);
		// Get a reference to the new actor.
		const actor = this.context.actor(payload.actor.id);

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
						if (!actor.collider && actor.internal.behavior) {
							log.warning('app', 'Behaviors will not function on Unity host apps without adding a'
								+ ' collider to this actor first. Recommend adding a primitive collider'
								+ ' to this actor.');
						}
						actor.internal.notifyCreated(true);
					} else {
						actor.internal.notifyCreated(false, message);
					}
				},
				reject: (reason?: any) => {
					actor.internal.notifyCreated(false, reason);
				}
			});

		return actor;
	}

	public createAnimation(actorId: string, animationName: string, options: CreateAnimationOptions) {
		const actor = this.actorSet[actorId];
		if (!actor) {
			log.error('app', `Failed to create animation on ${animationName}. Actor ${actorId} not found.`);
		}
		options = {
			wrapMode: AnimationWrapMode.Once,
			...options
		};

		// Transform animations must be specified in local space
		for (const frame of options.keyframes) {
			if (frame.value.transform && !safeGet(frame.value, 'transform', 'local')) {
				throw new Error("Transform animations must be specified in local space");
			}
		}

		// Resolve by-reference values now, ensuring they won't change in the
		// time between now and when this message is actually sent.
		options.keyframes = resolveJsonValues(options.keyframes);
		this.protocol.sendPayload({
			type: 'create-animation',
			actorId,
			animationName,
			...options
		} as CreateAnimation);
	}

	public setAnimationState(
		actorId: string,
		animationName: string,
		state: SetAnimationStateOptions
	) {
		const actor = this.actorSet[actorId];
		if (!actor) {
			log.error('app', `Failed to set animation state on ${animationName}. Actor ${actorId} not found.`);
		} else {
			this.protocol.sendPayload({
				type: 'set-animation-state',
				actorId,
				animationName,
				state
			} as SetAnimationState);
		}
	}

	public setMediaState(
		mediaInstance: MediaInstance,
		command: MediaCommand,
		options?: SetMediaStateOptions,
		mediaAssetId?: string,
	) {
		this.protocol.sendPayload({
			type: 'set-media-state',
			id: mediaInstance.id,
			actorId: mediaInstance.actor.id,
			mediaAssetId,
			mediaCommand: command,
			options
		} as SetMediaState);
	}

	public animateTo(
		actorId: string,
		value: Partial<ActorLike>,
		duration: number,
		curve: number[],
	) {
		const actor = this.actorSet[actorId];
		if (!actor) {
			log.error('app', `Failed animateTo. Actor ${actorId} not found.`);
		} else if (!Array.isArray(curve) || curve.length !== 4) {
			// tslint:disable-next-line:max-line-length
			log.error('app', '`curve` parameter must be an array of four numbers. Try passing one of the predefined curves from `AnimationEaseCurves`');
		} else {
			this.protocol.sendPayload({
				type: 'interpolate-actor',
				actorId,
				animationName: UUID(),
				value,
				duration,
				curve,
				enabled: true
			} as InterpolateActor);
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
			this.triggerEventRaised = this.triggerEventRaised.bind(this);
			this.setAnimationStateEventRaised = this.setAnimationStateEventRaised.bind(this);

			execution.on('protocol.update-actors', this.updateActors);
			execution.on('protocol.destroy-actors', this.localDestroyActors);
			execution.on('protocol.user-joined', this.userJoined);
			execution.on('protocol.user-left', this.userLeft);
			execution.on('protocol.update-user', this.updateUser);
			execution.on('protocol.perform-action', this.performAction);
			execution.on('protocol.receive-rpc', this.receiveRPC);
			execution.on('protocol.collision-event-raised', this.collisionEventRaised);
			execution.on('protocol.trigger-event-raised', this.triggerEventRaised);
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

	private assetsIterable() {
		return new AssetContainerIterable([...this.assetContainers]);
	}

	public update() {
		// Early out if no state changes occurred.
		if (this.generation === this.prevGeneration) {
			return;
		}

		this.prevGeneration = this.generation;

		const syncObjects = [
			...Object.values(this.actorSet),
			...this.assetsIterable(),
			...Object.values(this.userSet)
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
			} else if (patchable instanceof User) {
				this.protocol.sendPayload({
					type: 'user-update',
					user: patch as UserLike
				} as UserUpdate);
			}
		}

		if (this.nextUpdatePromise) {
			this.resolveNextUpdatePromise();
			this.nextUpdatePromise = null;
			this.resolveNextUpdatePromise = null;
		}
	}

	private nextUpdatePromise: Promise<void>;
	private resolveNextUpdatePromise: () => void;
	/** @hidden */
	public nextUpdate(): Promise<void> {
		if (this.nextUpdatePromise) {
			return this.nextUpdatePromise;
		}

		return this.nextUpdatePromise = new Promise(resolve => {
			this.resolveNextUpdatePromise = resolve;
		});
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
		if (actionEvent.user) {
			const targetActor = this.actorSet[actionEvent.targetId];
			if (targetActor) {
				targetActor.internal.performAction(actionEvent);
			}
		}
	}

	public collisionEventRaised(collisionEvent: CollisionEvent) {
		const actor = this.actorSet[collisionEvent.colliderOwnerId];
		const otherActor = this.actorSet[(collisionEvent.collisionData.otherActorId)];
		if (actor && otherActor) {
			// Update the collision data to contain the actual other actor.
			collisionEvent.collisionData = {
				...collisionEvent.collisionData,
				otherActor
			};

			actor.internal.collisionEventRaised(
				collisionEvent.eventType,
				collisionEvent.collisionData);
		}
	}

	public triggerEventRaised(triggerEvent: TriggerEvent) {
		const actor = this.actorSet[triggerEvent.colliderOwnerId];
		const otherActor = this.actorSet[triggerEvent.otherColliderOwnerId];
		if (actor && otherActor) {
			actor.internal.triggerEventRaised(
				triggerEvent.eventType,
				otherActor);
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
			this.protocol.sendPayload({
				type: 'set-behavior',
				actorId,
				behaviorType: newBehaviorType || 'none'
			} as SetBehavior);
		}
	}

	public lookupAsset(id: string): Asset {
		if (id === ZeroGuid) return null;

		for (const c of this.assetContainers) {
			if (c.assetsById[id]) {
				return c.assetsById[id];
			}
		}
	}
}
