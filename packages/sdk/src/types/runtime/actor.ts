/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Collider,
    ColliderLike,
    CollisionData,
    CollisionLayer,
    Light,
    LightLike,
    RigidBody,
    RigidBodyLike,
    Text,
    TextLike,
    Transform,
    TransformLike,
    User
} from '.';
import {
    AnimationEvent,
    AnimationKeyframe,
    AnimationWrapMode,
    Context,
    LookAtMode,
    PrimitiveDefinition
} from '../..';
import { log } from '../../log';
import BufferedEventEmitter from '../../utils/bufferedEventEmitter';
import observe from '../../utils/observe';
import readPath from '../../utils/readPath';
import { createForwardPromise, ForwardPromise } from '../forwardPromise';
import { InternalActor } from '../internal/actor';
import { CollisionEventType, CreateColliderType } from '../network/payloads';
import { SubscriptionType } from '../network/subscriptionType';
import { Behavior } from './behaviors';

/**
 * Describes the properties of an Actor.
 */
export interface ActorLike {
    id: string;
    parentId: string;
    name: string;
    tag: string;
    subscriptions: SubscriptionType[];
    transform: Partial<TransformLike>;
    light: Partial<LightLike>;
    rigidBody: Partial<RigidBodyLike>;
    collider: Partial<ColliderLike>;
    text: Partial<TextLike>;
}

/**
 * @hidden
 */
export interface ActorSet {
    [id: string]: Actor;
}

/**
 * An actor represents an object instantiated on the host.
 */
export class Actor implements ActorLike {
    // tslint:disable:variable-name
    private _internal: InternalActor;
    /** @hidden */
    public get internal() { return this._internal; }

    private _emitter: BufferedEventEmitter;
    /** @hidden */
    public get emitter() { return this._emitter; }

    private _name: string;
    private _tag: string;
    private _parentId: string;
    private _subscriptions: SubscriptionType[] = [];
    private _transform: Transform;
    private _light?: Light;
    private _rigidBody?: RigidBody;
    private _collider?: Collider;
    private _text?: Text;
    // tslint:enable:variable-name

    /**
     * PUBLIC ACCESSORS
     */

    public get context() { return this._context; }
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get tag() { return this._tag; }
    public set tag(value) { this._tag = value; this.actorChanged('tag'); }
    public get subscriptions() { return this._subscriptions; }
    public get transform() { return this._transform; }
    public get light() { return this._light; }
    public get rigidBody() { return this._rigidBody; }
    public get collider() { return this._collider; }
    public get text() { return this._text; }
    public get children() { return this.context.actors.filter(actor => actor.parentId === this.id); }
    public get parent() { return this._context.actor(this._parentId); }
    public get parentId() { return this._parentId; }
    public set parentId(value) {
        if (value && value.startsWith('0000')) {
            value = undefined;
        }
        if (!this.context.actor(value)) {
            value = undefined; // throw?
        }
        this._parentId = value;
        this.actorChanged('parentId');
    }

    // tslint:disable-next-line:variable-name
    private constructor(private _context: Context, private _id: string) {
        this._internal = new InternalActor(this);
        this._emitter = new BufferedEventEmitter();
        this._transform = new Transform();
        // Actor patching: Observe the transform for changed values.
        observe(this._transform, 'transform', (...path: string[]) => this.actorChanged(...path));
    }

    /**
     * @hidden
     * TODO - get rid of this.
     */
    public static alloc(context: Context, id: string): Actor {
        return new Actor(context, id);
    }

    /**
     * PUBLIC METHODS
     */

    /**
     * Creates a new, empty actor without geometry.
     * @param context The SDK context object.
     * @param options Creation parameters and actor characteristics.
     */
    public static CreateEmpty(context: Context, options?: {
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        return context.internal.CreateEmpty(options);
    }

    /**
     * Creates a new actor from a GLTF resource.
     * @param context The SDK context object.
     * @param options Creation parameters and actor characteristics.
     */
    public static CreateFromGltf(context: Context, options: {
        resourceUrl: string,
        assetName?: string,
        colliderType?: CreateColliderType,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        return context.internal.CreateFromGltf(options);
    }

    /**
     * @deprecated
     * Use CreateFromGltf instead.
     */
    public static CreateFromGLTF(context: Context, options: {
        resourceUrl: string,
        assetName?: string,
        colliderType?: CreateColliderType,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        return context.internal.CreateFromGltf(options);
    }

    /**
     * Creates a new actor from a library resource.
     * AltspaceVR-specific list of library resources: https://account.altvr.com/kits
     * @param context The SDK context object.
     * @param options Creation parameters and actor characteristics.
     */
    public static CreateFromLibrary(context: Context, options: {
        resourceId: string,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        return context.internal.CreateFromLibrary(options);
    }

    /**
     * Creates a new actor with a primitive shape.
     * @param context The SDK context object.
     * @param options Creation parameters and actor characteristics.
     */
    public static CreatePrimitive(context: Context, options: {
        definition: PrimitiveDefinition,
        addCollider?: boolean,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        return context.internal.CreatePrimitive(options);
    }

    /**
     * Creates a new actor hierarchy from the provided prefab
     * @param context The current context
     * @param options.prefabId The ID of the prefab asset
     * @param options.actor The initial state of the root actor
     */
    public static CreateFromPrefab(context: Context, options: {
        prefabId: string,
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        return context.internal.CreateFromPrefab(options);
    }

    /**
     * Provides an awaitable object that resolves once the actor has been created on the host.
     */
    public created(): Promise<void> {
        if (this.internal.created) {
            return Promise.resolve();
        } else {
            return new Promise<void>((resolve, reject) => this.internal.enqueueCreatedPromise({ resolve, reject }));
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
    public enableLight(light?: Partial<LightLike>): ForwardPromise<Light> {
        if (!this._light) {
            this._light = new Light();
            this._light.copy(light);
            // Actor patching: Observe the light component for changed values.
            observe(this._light, 'light', (...path: string[]) => this.actorChanged(...path));
            return this.context.internal.enableLight(this.id, this._light);
        }
        return createForwardPromise(this._light, Promise.resolve(this._light));
    }

    /**
     * Adds a rigid body component to the actor.
     * @param rigidBody Rigid body characteristics.
     */
    public enableRigidBody(rigidBody?: Partial<RigidBodyLike>): ForwardPromise<RigidBody> {
        if (!this._rigidBody) {
            this._rigidBody = new RigidBody(this);
            this._rigidBody.copy(rigidBody);
            // Actor patching: Observe the rigidBody component for changed values.
            observe(this._rigidBody, 'rigidBody', (...path: string[]) => this.actorChanged(...path));
            this.subscribe('rigidbody');
            return this.context.internal.enableRigidBody(this.id, this._rigidBody);
        }
        return createForwardPromise(this._rigidBody, Promise.resolve(this._rigidBody));
    }

    // TODO @tombu: This will be enabled once the feature is ready for prime time.
    // /**
    //  * Adds a collider of the given type and parameters on the actor.
    //  * @param colliderType Type of the collider to enable.
    //  * @param collisionLayer The layer that the collider operates in.
    //  * @param isTrigger Whether the collider is a trigger volume or not.
    //  * @param center The center of the collider, or default of the object if none is provided.
    //  * @param radius The radius of the collider, or default bounding if non is provided.
    //  */
    // public enableCollider(
    //     colliderType: 'sphere',
    //     collisionLayer: CollisionLayer,
    //     isTrigger: boolean,
    //     center?: Vector3Like,
    //    radius?: number): ForwardPromise<Collider>;

    // /**
    //  * Adds a collider of the given type and parameters on the actor.
    //  * @param colliderType Type of the collider to enable.
    //  * @param collisionLayer The layer that the collider operates in.
    //  * @param isTrigger Whether the collider is a trigger volume or not.
    //  * @param center The center of the collider, or default of the object if none is provided.
    //  * @param size
    //  */
    // public enableCollider(
    //     colliderType: 'box',
    //     collisionLayer: CollisionLayer,
    //     isTrigger: boolean,
    //     center?: Vector3Like,
    //     size?: Vector3Like): ForwardPromise<Collider>;

    // /** @ignore */
    // public enableCollider(
    //     colliderType: 'box' | 'sphere',
    //     collisionLayer: CollisionLayer,
    //     isTrigger: boolean,
    //     center?: Vector3Like,
    //     size?: number | Vector3Like
    // ): ForwardPromise<Collider> {
    //     if (!this._collider) {
    //         this._collider = new Collider(this);
    //         observe(this._collider, 'collider', (...path: string[]) => this.actorChanged(...path));
    //         this.subscribe('collider');
    //         return this.context.internal.enableCollider(
    //             this.id,
    //             colliderType,
    //             collisionLayer,
    //             isTrigger,
    //             center,
    //             size);
    //     }
    //     return ForwardPromise.Resolve(this._collider);
    // }

    /**
     * Adds a text component to the actor.
     * @param text Text characteristics
     */
    public enableText(text?: Partial<TextLike>): ForwardPromise<Text> {
        if (!this._text) {
            this._text = new Text();
            this._text.copy(text);
            // Actor patching: Observe the text component for changed values.
            observe(this._text, 'text', (...path: string[]) => this.actorChanged(...path));
            return this.context.internal.enableText(this.id, this._text);
        }
        return createForwardPromise(this._text, Promise.resolve(this._text));
    }

    /**
     * Subscribe to updates from this actor.
     * @param subscription The type of subscription to add.
     */
    public subscribe(subscription: SubscriptionType) {
        return this.updateSubscriptions({
            adds: [subscription],
            removes: []
        });
    }

    /**
     * Unsubscribe from updates from this actor.
     * @param subscription The type of subscription to remove.
     */
    public unsubscribe(subscription: SubscriptionType) {
        return this.updateSubscriptions({
            adds: [],
            removes: [subscription]
        });
    }

    private updateSubscriptions(options: {
        adds?: SubscriptionType | SubscriptionType[],
        removes?: SubscriptionType | SubscriptionType[]
    }) {
        const adds = options.adds ? Array.isArray(options.adds) ? options.adds : [options.adds] : [];
        const removes = options.removes ? Array.isArray(options.removes) ? options.removes : [options.removes] : [];
        this._subscriptions = this._subscriptions.filter(subscription => removes.indexOf(subscription) < 0);
        this._subscriptions.push(...adds);
        this.context.internal.updateSubscriptions(this.id, 'actor', options);
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
     * Create an animation on this actor.
     * @param options The animation keyframes, events, and other characteristics.
     */
    public createAnimation(options: {
        animationName: string,
        keyframes: AnimationKeyframe[],
        events: AnimationEvent[],
        wrapMode?: AnimationWrapMode
    }): Promise<void> {
        return this.context.internal.createAnimation(this.id, options);
    }

    /**
     * Start playing an animation on this actor.
     * @param animationName The name of the animation to start playing.
     */
    public startAnimation(animationName: string, hasRootMotion?: boolean) {
        this.context.internal.startAnimation(this.id, animationName, hasRootMotion);
    }

    /**
     * Stop playing an animation on this actor and reset the animation's state.
     * @param animationName The name of the animation to stop playing.
     */
    public stopAnimation(animationName: string) {
        this.context.internal.stopAnimation(this.id, animationName);
    }

    /**
     * Resets the animation to its initial state.
     * @param animationName The name of the animation to reset.
     */
    public resetAnimation(animationName: string) {
        this.context.internal.resetAnimation(this.id, animationName);
    }

    /**
     * Pauses the animation.
     * @param animationName The name of the animation to pause.
     */
    public pauseAnimation(animationName: string) {
        this.context.internal.pauseAnimation(this.id, animationName);
    }

    /**
     * Resumes the animation.
     * @param animationName The name of the animation to resume.
     */
    public resumeAnimation(animationName: string) {
        this.context.internal.resumeAnimation(this.id, animationName);
    }

    public lookAt(targetOrId: Actor | User | string, lookAtMode: LookAtMode) {
        let targetId: string;
        if (lookAtMode !== LookAtMode.None) {
            if (typeof (targetOrId) === 'object' && targetOrId.id !== undefined) {
                targetId = targetOrId.id;
            } else if (typeof (targetOrId) === 'string') {
                targetId = targetOrId;
            }
        }
        this.context.internal.lookAt(this.id, targetId, lookAtMode);
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

    /**
     * Actor Events
     */

    /**
     * Add an event handler for the collision enter event.
     * @param handler The handler to call when the collision event is raised.
     */
    public onCollisionEnter(handler: (collisionData: CollisionData) => any): this {
        this.context.internal.updateCollisionEventSubscriptions(this._id, { adds: CollisionEventType.CollisionEnter });
        this.emitter.on(CollisionEventType.CollisionEnter, handler);
        return this;
    }

    /**
     * Add an event handler for the collision exit event.
     * @param handler The handler to call when the collision event is raised.
     */
    public onCollisionExit(handler: (collisionData: CollisionData) => any): this {
        this.context.internal.updateCollisionEventSubscriptions(this._id, { adds: CollisionEventType.CollisionExit });
        this.emitter.on(CollisionEventType.CollisionExit, handler);
        return this;
    }

    /**
     * Add an event handler for the trigger enter event.
     * @param handler The handler to call when the collision event is raised.
     */
    public onTriggerEnter(handler: (collisionData: CollisionData) => any): this {
        this.context.internal.updateCollisionEventSubscriptions(this._id, { adds: CollisionEventType.TriggerEnter });
        this.emitter.on(CollisionEventType.TriggerEnter, handler);
        return this;
    }

    /**
     * Add an event handler for the trigger exit event.
     * @param handler The handler to call when the collision event is raised.
     */
    public onTriggerExit(handler: (collisionData: CollisionData) => any): this {
        this.context.internal.updateCollisionEventSubscriptions(this._id, { adds: CollisionEventType.TriggerExit });
        this.emitter.on(CollisionEventType.TriggerExit, handler);
        return this;
    }

    public copy(from: Partial<ActorLike>): this {
        // Pause change detection while we copy the values into the actor.
        const wasObserving = this.internal.observing;
        this.internal.observing = false;

        // tslint:disable:curly
        if (!from) return this;
        if (from.id) this._id = from.id;
        if (from.parentId) this._parentId = from.parentId;
        if (from.name) this._name = from.name;
        if (from.tag) this._tag = from.tag;
        if (from.transform) this._transform.copy(from.transform);
        if (from.light) {
            if (!this._light)
                this.enableLight(from.light);
            else
                this.light.copy(from.light);
        }
        if (from.rigidBody) {
            if (!this._rigidBody)
                this.enableRigidBody(from.rigidBody);
            else
                this.rigidBody.copy(from.rigidBody);
        }
        // TODO @tombu:  Add in colliders here once feature is turned on.
        if (from.text) {
            if (!this._text)
                this.enableText(from.text);
            else
                this.text.copy(from.text);
        }
        this.internal.observing = wasObserving;
        return this;
        // tslint:enable:curly
    }

    public toJSON() {
        return {
            id: this._id,
            parentId: this._parentId,
            name: this._name,
            tag: this._tag,
            transform: this._transform.toJSON(),
            light: this._light ? this._light.toJSON() : undefined,
            rigidBody: this._rigidBody ? this._rigidBody.toJSON() : undefined,
            collider: this._collider ? this._collider.toJSON() : undefined,
            text: this._text ? this._text.toJSON() : undefined
        } as ActorLike;
    }

    /**
     * PRIVATE METHODS
     */

    private actorChanged = (...path: string[]) => {
        if (this.internal.observing) {
            this.internal.patch = this.internal.patch || {} as ActorLike;
            readPath(this, this.internal.patch, ...path);
            // Wait until the actor has been created before triggering a state update.
            this.created()
                .then(() => this.context.internal.incrementGeneration())
                .catch(reason => log.error('app', reason));
        }
    }
}
