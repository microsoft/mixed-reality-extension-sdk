/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import events from 'events';
import {
	ActionHandler,
	ActionState,
	ActorTransform,
	ActorTransformLike,
	Animation,
	Appearance,
	AppearanceLike,
	Asset,
	AssetContainer,
	Attachment,
	AttachmentLike,
	AttachPoint,
	Behavior,
	Collider,
	ColliderGeometry,
	ColliderLike,
	ColliderType,
	CollisionLayer,
	Context,
	DiscreteAction,
	EaseCurve,
	Guid,
	Light,
	LightLike,
	log,
	LookAt,
	LookAtLike,
	LookAtMode,
	MediaInstance,
	Prefab,
	PrimitiveDefinition,
	ReadonlyMap,
	RigidBody,
	RigidBodyLike,
	SetAudioStateOptions,
	SetVideoStateOptions,
	Text,
	TextLike,
	User,
	Vector3Like,
	ZeroGuid,
} from '..';
import {
	observe,
	Patchable,
	readPath,
	resolveJsonValues,
	SubscriptionType,
	unobserve
} from '../internal';
import { ActorInternal } from './actorInternal';

/**
 * Describes the properties of an Actor.
 */
export interface ActorLike {
	id: Guid;
	parentId: Guid;
	name: string;
	tag: string;

	/**
	 * When supplied, this actor will be unsynchronized, and only exist on the client
	 * of the User with the given ID. This value can only be set at actor creation.
	 * Any actors parented to this actor will also be exclusive to the given user.
	 */
	exclusiveToUser: Guid;
	subscriptions: SubscriptionType[];
	transform: Partial<ActorTransformLike>;
	appearance: Partial<AppearanceLike>;
	light: Partial<LightLike>;
	rigidBody: Partial<RigidBodyLike>;
	collider: Partial<ColliderLike>;
	text: Partial<TextLike>;
	attachment: Partial<AttachmentLike>;
	lookAt: Partial<LookAtLike>;
	grabbable: boolean;
}

/**
 * An actor represents an object instantiated on the host.
 */
export class Actor implements ActorLike, Patchable<ActorLike> {
	private _internal = new ActorInternal(this);
	/** @hidden */
	public get internal() { return this._internal; }

	private _emitter = new events.EventEmitter();
	/** @hidden */
	public get emitter() { return this._emitter; }

	private _name: string;
	private _tag: string;
	private _exclusiveToUser: Guid;
	private _parentId = ZeroGuid;
	private _subscriptions: SubscriptionType[] = [];
	private _transform = new ActorTransform();
	private _appearance = new Appearance(this);
	private _light: Light;
	private _rigidBody: RigidBody;
	private _collider: Collider;
	private _text: Text;
	private _attachment: Attachment;
	private _lookAt: LookAt;
	private _grabbable = false;
	private _grab: DiscreteAction;

	private get grab() { this._grab = this._grab || new DiscreteAction(); return this._grab; }

	/*
	 * PUBLIC ACCESSORS
	 */

	public get context() { return this._context; }
	public get id() { return this._id; }
	public get name() { return this._name; }
	public get tag() { return this._tag; }
	public set tag(value) { this._tag = value; this.actorChanged('tag'); }

	/** @inheritdoc */
	public get exclusiveToUser() { return this._exclusiveToUser; }
	public get subscriptions() { return this._subscriptions; }
	public get transform() { return this._transform; }
	public set transform(value) { this._transform.copy(value); }
	public get appearance() { return this._appearance; }
	public set appearance(value) { this._appearance.copy(value); }
	public get light() { return this._light; }
	public get rigidBody() { return this._rigidBody; }
	public get collider() { return this._collider; }
	public get text() { return this._text; }
	public get attachment() { return this._attachment; }
	public get lookAt() { return this._lookAt; }
	public get children() { return this.context.actors.filter(actor => actor.parentId === this.id); }
	public get parent() { return this._context.actor(this._parentId); }
	public set parent(value) { this.parentId = value && value.id || ZeroGuid; }
	public get parentId() { return this._parentId; }
	public set parentId(value) {
		const parentActor = this.context.actor(value);
		if (!value || !parentActor) {
			value = ZeroGuid;
		}
		if (parentActor && parentActor.exclusiveToUser && parentActor.exclusiveToUser !== this.exclusiveToUser) {
			throw new Error(`User-exclusive actor ${this.id} can only be parented to inclusive actors ` +
				"and actors that are exclusive to the same user.");
		}
		if (this._parentId !== value) {
			this._parentId = value;
			this.actorChanged('parentId');
		}
	}

	public get grabbable() { return this._grabbable; }
	public set grabbable(value) {
		if (value !== this._grabbable) {
			this._grabbable = value;
			this.actorChanged('grabbable');
		}
	}

	private constructor(private _context: Context, private _id: Guid) {
		// Actor patching: Observe the transform for changed values.
		observe({
			target: this._transform,
			targetName: 'transform',
			notifyChanged: (...path: string[]) => this.actorChanged(...path)
		});

		// Observe changes to the looks of this actor
		observe({
			target: this._appearance,
			targetName: 'appearance',
			notifyChanged: (...path: string[]) => this.actorChanged(...path)
		});
	}

	/**
	 * @hidden
	 * TODO - get rid of this.
	 */
	public static alloc(context: Context, id: Guid): Actor {
		return new Actor(context, id);
	}

	/**
	 * PUBLIC METHODS
	 */

	/**
	 * Creates a new, empty actor without geometry.
	 * @param context The SDK context object.
	 * @param options.actor The initial state of the actor.
	 */
	public static Create(context: Context, options?: {
		actor?: Partial<ActorLike>;
	}): Actor {
		return context.internal.Create(options);
	}

	/**
	 * @deprecated
	 * Use [[Actor.Create]] instead.
	 */
	public static CreateEmpty(context: Context, options?: {
		actor?: Partial<ActorLike>;
	}): Actor {
		return Actor.Create(context, options);
	}

	/**
	 * Creates a new actor from a library resource.
	 * Host-specific list of library resources. For AltspaceVR, see: https://account.altvr.com/kits
	 * @param context The SDK context object.
	 * @param options.resourceId The id of the library resource to instantiate.
	 * @param options.actor The initial state of the root actor.
	 */
	public static CreateFromLibrary(context: Context, options: {
		resourceId: string;
		actor?: Partial<ActorLike>;
	}): Actor {
		return context.internal.CreateFromLibrary(options);
	}

	/**
	 * Creates a new actor hierarchy from the provided prefab.
	 * @param context The SDK context object.
	 * @param options.prefabId The ID of a prefab asset to spawn.
	 * @param options.collisionLayer If the prefab contains colliders, put them on this layer.
	 * @param options.actor The initial state of the root actor.
	 */
	public static CreateFromPrefab(context: Context, options: {
		prefabId: Guid;
		collisionLayer?: CollisionLayer;
		actor?: Partial<ActorLike>;
	}): Actor;

	/**
	 * Creates a new actor hierarchy from the provided prefab.
	 * @param context The SDK context object.
	 * @param options.prefab The prefab asset to spawn.
	 * @param options.collisionLayer If the prefab contains colliders, put them on this layer.
	 * @param options.actor The initial state of the root actor.
	 */
	public static CreateFromPrefab(context: Context, options: {
		prefab: Prefab;
		collisionLayer?: CollisionLayer;
		actor?: Partial<ActorLike>;
	}): Actor;

	/**
	 * Creates a new actor hierarchy from the provided prefab.
	 * @param context The SDK context object.
	 * @param options.firstPrefabFrom An asset array containing at least one prefab.
	 * @param options.collisionLayer If the prefab contains colliders, put them on this layer.
	 * @param options.actor The initial state of the root actor.
	 */
	public static CreateFromPrefab(context: Context, options: {
		firstPrefabFrom: Asset[];
		collisionLayer?: CollisionLayer;
		actor?: Partial<ActorLike>;
	}): Actor;

	public static CreateFromPrefab(context: Context, options: {
		prefabId?: Guid;
		prefab?: Prefab;
		firstPrefabFrom?: Asset[];
		collisionLayer?: CollisionLayer;
		actor?: Partial<ActorLike>;
	}): Actor {
		let prefabId = options.prefabId;
		if (!prefabId && options.prefab) {
			prefabId = options.prefab.id;
		}
		if (!prefabId && options.firstPrefabFrom) {
			prefabId = options.firstPrefabFrom.find(a => !!a.prefab).id;
		}
		if (!prefabId) {
			throw new Error("No prefab supplied to CreateFromPrefab");
		}

		return context.internal.CreateFromPrefab({
			prefabId,
			collisionLayer: options.collisionLayer,
			actor: options.actor
		});
	}

	/**
	 * Load a glTF model, and spawn the first prefab in the resulting assets. Equivalent
	 * to using [[AssetContainer.loadGltf]] and [[Actor.CreateFromPrefab]].
	 * @param container The asset container to load the glTF assets into
	 * @param options.uri A URI to a .gltf or .glb file
	 * @param options.colliderType The type of collider to add to each mesh actor
	 * @param options.actor The initial state of the actor
	 */
	public static CreateFromGltf(container: AssetContainer, options: {
		uri: string;
		colliderType?: 'box' | 'mesh';
		actor?: Partial<ActorLike>;
	}): Actor {
		return container.context.internal.CreateFromGltf(container, options);
	}

	/**
	 * Create an actor with a newly generated mesh. Equivalent to using
	 * [[AssetContainer.createPrimitiveMesh]] and adding the result to [[Actor.Create]].
	 * @param container The asset container to load the mesh into
	 * @param options.definition The primitive shape and size
	 * @param options.addCollider Add an auto-typed collider to the actor
	 * @param options.actor The initial state of the actor
	 */
	public static CreatePrimitive(container: AssetContainer, options: {
		definition: PrimitiveDefinition;
		addCollider?: boolean;
		actor?: Partial<ActorLike>;
	}): Actor {
		const actor = options.actor || {};
		const mesh = container.createPrimitiveMesh(actor.name, options.definition);
		return Actor.Create(container.context, {
			actor: {
				...actor,
				appearance: {
					...actor.appearance,
					meshId: mesh.id
				},
				collider: options.addCollider
					? actor.collider || { geometry: { shape: ColliderType.Auto } }
					: actor.collider
			}
		});
	}

	/**
	 * Creates a Promise that will resolve once the actor is created on the host.
	 * @returns Promise<void>
	 */
	public created(): Promise<void> {
		if (!this.internal.created) {
			return new Promise<void>((resolve, reject) => this.internal.enqueueCreatedPromise({ resolve, reject }));
		}
		if (this.internal.created.success) {
			return Promise.resolve();
		} else {
			return Promise.reject(this.internal.created.reason);
		}
	}

	/**
	 * Destroys the actor.
	 */
	public destroy(): void {
		this.context.internal.destroyActor(this.id);
	}

	/**
	 * Adds a light component to the actor.
	 * @param light Light characteristics.
	 */
	public enableLight(light?: Partial<LightLike>) {
		if (!this._light) {
			this._light = new Light();
			// Actor patching: Observe the light component for changed values.
			observe({
				target: this._light,
				targetName: 'light',
				notifyChanged: (...path: string[]) => this.actorChanged(...path),
				// Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
				triggerNotificationsNow: true
			});
		}
		// Copying the new values will trigger an actor update and enable/update the light component.
		this._light.copy(light);
	}

	/**
	 * Adds a rigid body component to the actor.
	 * @param rigidBody Rigid body characteristics.
	 */
	public enableRigidBody(rigidBody?: Partial<RigidBodyLike>) {
		if (!this._rigidBody) {
			this._rigidBody = new RigidBody(this);
			// Actor patching: Observe the rigid body component for changed values.
			observe({
				target: this._rigidBody,
				targetName: 'rigidBody',
				notifyChanged: (...path: string[]) => this.actorChanged(...path),
				// Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
				triggerNotificationsNow: true
			});
		}
		// Copying the new values will trigger an actor update and enable/update the rigid body component.
		this._rigidBody.copy(rigidBody);
	}

	/**
	 * Adds a collider of the given type and parameters on the actor.
	 * @param colliderType Type of the collider to enable.
	 * @param isTrigger Whether the collider is a trigger volume or not.
	 * @param radius The radius of the collider. If omitted, a best-guess radius is chosen
	 * based on the size of the currently assigned mesh (loading meshes are not considered).
	 * If no mesh is assigned, defaults to 0.5.
	 * @param center The center of the collider, or default of the object if none is provided.
	 */
	// * @param collisionLayer The layer that the collider operates in.
	public setCollider(
		colliderType: ColliderType.Sphere,
		// collisionLayer: CollisionLayer,
		isTrigger: boolean,
		radius?: number,
		center?: Vector3Like
	): void;

	/**
	 * Adds a collider of the given type and parameters on the actor.
	 * @param colliderType Type of the collider to enable.
	 * @param isTrigger Whether the collider is a trigger volume or not.
	 * @param size The dimensions of the collider. If omitted, a best-guess size is chosen
	 * based on the currently assigned mesh (loading meshes are not considered).
	 * If no mesh is assigned, defaults to (1,1,1).
	 * @param center The center of the collider, or default of the object if none is provided.
	 */
	public setCollider(
		colliderType: ColliderType.Box,
		// collisionLayer: CollisionLayer,
		isTrigger: boolean,
		size?: Vector3Like,
		center?: Vector3Like
	): void;

	/**
	 * Adds a collider of the give type and parameters on the actor.
	 * @param colliderType Type of the collider to enable.
	 * @param isTrigger Whether the collider is a trigger volume or not.
	 * @param size The dimensions of the collider, with the largest component of the vector
	 * being the primary axis and height of the capsule (including end caps), and the smallest the diameter.
	 * If omitted, a best-guess size is chosen based on the currently assigned mesh
	 * (loading meshes are not considered). If no mesh is assigned, defaults to (1, 1, 1).
	 * @param center The center of the collider, or default of the object if none is provided.
	 */
	public setCollider(
		colliderType: ColliderType.Capsule,
		isTrigger: boolean,
		size?: Vector3Like,
		center?: Vector3Like
	): void;

	/**
	 * Adds a collider whose shape is determined by the current mesh.
	 * @param colliderType Type of the collider to enable.
	 * @param isTrigger Whether the collider is a trigger volume or not.
	 */
	public setCollider(
		colliderType: ColliderType.Auto,
		isTrigger: boolean
	): void;

	public setCollider(
		colliderType: ColliderType,
		// collisionLayer: CollisionLayer,
		isTrigger: boolean,
		size?: number | Vector3Like,
		center = { x: 0, y: 0, z: 0 } as Vector3Like
	): void {
		const colliderGeometry = this.generateColliderGeometry(colliderType, size, center);
		if (colliderGeometry) {
			this._setCollider({
				enabled: true,
				isTrigger,
				// collisionLayer,
				geometry: colliderGeometry
			} as ColliderLike);
		}
	}

	/**
	 * Adds a text component to the actor.
	 * @param text Text characteristics
	 */
	public enableText(text?: Partial<TextLike>) {
		if (!this._text) {
			this._text = new Text();
			// Actor patching: Observe the text component for changed values.
			observe({
				target: this._text,
				targetName: 'text',
				notifyChanged: (...path: string[]) => this.actorChanged(...path),
				// Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
				triggerNotificationsNow: true
			});
		}
		// Copying the new values will trigger an actor update and enable/update the text component.
		this._text.copy(text);
	}

	/**
	 * Instruct the actor to face another object, or stop facing an object.
	 * @param actorOrActorId The Actor or id of the actor to face.
	 * @param lookAtMode (Optional) How to face the target. @see LookUpMode.
	 * @param backward (Optional) If true, actor faces away from target rather than toward.
	 */
	public enableLookAt(actorOrActorId: Actor | Guid, mode?: LookAtMode, backward?: boolean) {
		// Resolve the actorId value.
		let actorId = ZeroGuid;
		if (actorOrActorId instanceof Actor && actorOrActorId.id !== undefined) {
			actorId = actorOrActorId.id;
		} else if (typeof (actorOrActorId) === 'string') {
			actorId = actorOrActorId;
		}
		// Allocate component if necessary.
		if (!this._lookAt) {
			this._lookAt = new LookAt();
			// Actor patching: Observe the lookAt component for changed values.
			observe({
				target: this._lookAt,
				targetName: 'lookAt',
				notifyChanged: (...path: string[]) => this.actorChanged(...path),
				// Trigger notifications for every observed leaf node to ensure we get all values in the
				// initial patch.
				triggerNotificationsNow: true
			});
		}
		// Set component values.
		this._lookAt.copy({
			actorId,
			mode,
			backward
		});
	}

	/**
	 * Attach to the user at the given attach point.
	 * @param userOrUserId The User or id of user to attach to.
	 * @param attachPoint Where on the user to attach.
	 */
	public attach(userOrUserId: User | Guid, attachPoint: AttachPoint) {
		const userId = userOrUserId instanceof User ? userOrUserId.id : userOrUserId;
		if (!this._attachment) {
			// Actor patching: Observe the attachment for changed values.
			this._attachment = new Attachment();
			observe({
				target: this._attachment,
				targetName: 'attachment',
				notifyChanged: (...path: string[]) => this.actorChanged(...path)
			});
		}
		this._attachment.userId = userId;
		this._attachment.attachPoint = attachPoint;
	}

	/**
	 * If attached to a user, detach from it.
	 */
	public detach() {
		this._attachment.userId = ZeroGuid;
		this._attachment.attachPoint = 'none';
	}

	/**
	 * Subscribe to updates from this actor.
	 * @param subscription The type of subscription to add.
	 */
	public subscribe(subscription: SubscriptionType) {
		this._subscriptions.push(subscription);
		this.actorChanged('subscriptions');
	}

	/**
	 * Unsubscribe from updates from this actor.
	 * @param subscription The type of subscription to remove.
	 */
	public unsubscribe(subscription: SubscriptionType) {
		this._subscriptions = this._subscriptions.filter(value => value !== subscription);
		this.actorChanged('subscriptions');
	}

	/**
	 * Add a grad handler to be called when the given action state has changed.
	 * @param grabState The grab state to fire the handler on.
	 * @param handler The handler to call when the grab state has changed.
	 */
	public onGrab(grabState: 'begin' | 'end', handler: ActionHandler) {
		const actionState: ActionState = (grabState === 'begin') ? 'started' : 'stopped';
		this.grab.on(actionState, handler);
	}

	/**
	 * Sets the behavior on this actor.
	 * @param behavior The type of behavior to set. Pass null to clear the behavior.
	 */
	public setBehavior<BehaviorT extends Behavior>(behavior: { new(): BehaviorT }): BehaviorT {
		if (behavior) {
			const newBehavior = new behavior();
			this.internal.behavior = newBehavior;
			this.context.internal.setBehavior(this.id, this.internal.behavior.behaviorType);
			return newBehavior;
		}

		this.internal.behavior = null;
		this.context.internal.setBehavior(this.id, null);
		return null;
	}

	/**
	 * Starts playing a preloaded sound.
	 * @param soundAssetId Name of sound asset preloaded using AssetManager.
	 * @param options Adjustments to pitch and volume, and other characteristics.
	 */
	public startSound(
		soundAssetId: Guid,
		options: SetAudioStateOptions,
	): MediaInstance {
		return new MediaInstance(this, soundAssetId).start(options);
	}

	/**
	 * Starts playing a preloaded video stream.
	 * @param videoStreamAssetId Name of video stream asset preloaded using AssetManager.
	 * @param options Adjustments to pitch and volume, and other characteristics.
	 */
	public startVideoStream(
		videoStreamAssetId: Guid,
		options: SetVideoStateOptions,
	): MediaInstance {
		return new MediaInstance(this, videoStreamAssetId).start(options);
	}

	/**
	 * @deprecated
	 * Use [[Animation.AnimateTo]] instead.
	 * @param value The desired final state of the actor.
	 * @param duration The length of the interpolation (in seconds).
	 * @param curve The cubic-bezier curve parameters. @see AnimationEaseCurves for predefined values.
	 */
	public animateTo(value: Partial<ActorLike>, duration: number, curve: number[]) {
		Animation.AnimateTo(this.context, this as Actor, {
			duration,
			destination: value,
			easing: curve as EaseCurve
		});
	}

	/**
	 * Finds child actors matching `name`.
	 * @param name The name of the actors to find.
	 * @param recurse Whether or not to search recursively.
	 */
	public findChildrenByName(name: string, recurse: boolean): Actor[] {
		const namedChildren = this.children.filter(actor => actor.name === name);
		if (!recurse) {
			return namedChildren;
		}

		for (const child of this.children) {
			namedChildren.push(...child.findChildrenByName(name, recurse));
		}

		return namedChildren;
	}

	/** The list of animations that target this actor, by ID. */
	public get targetingAnimations() {
		return this.context.animations
			.filter(anim => anim.targetIds.includes(this.id))
			.reduce(
				(map, anim) => {
					map.set(anim.id, anim);
					return map;
				},
				new Map<Guid, Animation>()
			) as ReadonlyMap<Guid, Animation>;
	}

	/** The list of animations that target this actor, by name. */
	public get targetingAnimationsByName() {
		return this.context.animations
			.filter(anim => anim.targetIds.includes(this.id) && anim.name)
			.reduce(
				(map, anim) => {
					map.set(anim.name, anim);
					return map;
				},
				new Map<string, Animation>()
			) as ReadonlyMap<string, Animation>;
	}

	/** Recursively search for the named animation from this actor. */
	public findAnimationInChildrenByName(name: string): Animation {
		const namedAnims = this.targetingAnimationsByName;
		if (namedAnims.has(name)) {
			return namedAnims.get(name);
		} else {
			return this.children.reduce(
				(val, child) => val || child.findAnimationInChildrenByName(name),
				null as Animation
			);
		}
	}

	/** @hidden */
	public copy(from: Partial<ActorLike>): this {
		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		if (!from) { return this; }
		if (from.id) { this._id = from.id; }
		if (from.parentId) { this._parentId = from.parentId; }
		if (from.name) { this._name = from.name; }
		if (from.tag) { this._tag = from.tag; }
		if (from.exclusiveToUser || from.parentId) {
			this._exclusiveToUser = this.parent && this.parent.exclusiveToUser || from.exclusiveToUser;
		}
		if (from.transform) { this._transform.copy(from.transform); }
		if (from.attachment) { this.attach(from.attachment.userId, from.attachment.attachPoint); }
		if (from.appearance) { this._appearance.copy(from.appearance); }
		if (from.light) { this.enableLight(from.light); }
		if (from.rigidBody) { this.enableRigidBody(from.rigidBody); }
		if (from.collider) { this._setCollider(from.collider); }
		if (from.text) { this.enableText(from.text); }
		if (from.lookAt) { this.enableLookAt(from.lookAt.actorId, from.lookAt.mode); }
		if (from.grabbable !== undefined) { this._grabbable = from.grabbable; }

		this.internal.observing = wasObserving;
		return this;
	}

	/** @hidden */
	public toJSON() {
		return {
			id: this._id,
			parentId: this._parentId,
			name: this._name,
			tag: this._tag,
			exclusiveToUser: this._exclusiveToUser,
			transform: this._transform.toJSON(),
			appearance: this._appearance.toJSON(),
			attachment: this._attachment ? this._attachment.toJSON() : undefined,
			light: this._light ? this._light.toJSON() : undefined,
			rigidBody: this._rigidBody ? this._rigidBody.toJSON() : undefined,
			collider: this._collider ? this._collider.toJSON() : undefined,
			text: this._text ? this._text.toJSON() : undefined,
			lookAt: this._lookAt ? this._lookAt.toJSON() : undefined,
			grabbable: this._grabbable
		} as ActorLike;
	}

	/**
	 * INTERNAL METHODS
	 */

	/**
	 * Prepare outgoing messages
	 * @hidden
	 */
	public static sanitize(msg: ActorLike): ActorLike;
	public static sanitize(msg: Partial<ActorLike>): Partial<ActorLike>;
	public static sanitize(msg: ActorLike | Partial<ActorLike>): ActorLike | Partial<ActorLike> {
		msg = resolveJsonValues(msg);
		if (msg.appearance) {
			msg.appearance = Appearance.sanitize(msg.appearance);
		}
		return msg;
	}

	/** @hidden */
	public actorChanged = (...path: string[]) => {
		if (this.internal.observing) {
			this.internal.patch = this.internal.patch || {} as ActorLike;
			readPath(this, this.internal.patch, ...path);
			this.context.internal.incrementGeneration();
		}
	};

	/**
	 * PRIVATE METHODS
	 */

	private generateColliderGeometry(
		colliderType: ColliderType,
		size?: number | Vector3Like,
		center = { x: 0, y: 0, z: 0 } as Vector3Like,
	): ColliderGeometry {
		switch (colliderType) {
			case ColliderType.Box:
				return {
					shape: ColliderType.Box,
					center,
					size: size as Readonly<Vector3Like>
				};
			case ColliderType.Sphere:
				return {
					shape: ColliderType.Sphere,
					center,
					radius: size as number
				};
			case ColliderType.Capsule:
				return {
					shape: ColliderType.Capsule,
					center,
					size: size as Readonly<Vector3Like>
				};
			case 'auto':
				return {
					shape: ColliderType.Auto
				};
			default:
				log.error(null,
					'Trying to enable a collider on the actor with an invalid collider geometry type.' +
					`Type given is ${colliderType}`);

				return undefined;
		}
	}

	private _setCollider(collider: Partial<ColliderLike>) {
		const oldCollider = this._collider;
		if (this._collider) {
			unobserve(this._collider);
			this._collider = undefined;
		}

		this._collider = new Collider(this, collider);
		if (oldCollider) {
			this._collider.internal.copyHandlers(oldCollider.internal);
		}

		// Actor patching: Observe the collider component for changed values.
		observe({
			target: this._collider,
			targetName: 'collider',
			notifyChanged: (...path: string[]) => this.actorChanged(...path),
			// Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
			triggerNotificationsNow: true
		});
	}
}
