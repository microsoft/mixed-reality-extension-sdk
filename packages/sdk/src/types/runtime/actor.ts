/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import events from 'events';
import {
    Collider,
    ColliderLike,
    CollisionData,
    Light,
    LightLike,
    Material,
    RigidBody,
    RigidBodyLike,
    Text,
    TextLike,
    Transform,
    TransformLike,
    User
} from '.';
import {
    Context,
    CreateAnimationOptions,
    LookAtMode,
    PrimitiveDefinition,
    SetAnimationStateOptions
} from '../..';
import { ZeroGuid } from '../../constants';
import { log } from '../../log';
import { LoadSoundOptions, SetSoundStateOptions } from '../../sound';
import observe from '../../utils/observe';
import readPath from '../../utils/readPath';
import { createForwardPromise, ForwardPromise } from '../forwardPromise';
import { InternalActor } from '../internal/actor';
import { CollisionEventType, CreateColliderType } from '../network/payloads';
import { SubscriptionType } from '../network/subscriptionType';
import { Patchable } from '../patchable';
import { Behavior } from './behaviors';
import { SoundInstance } from './sound';

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
    materialId: string;
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
export class Actor implements ActorLike, Patchable<ActorLike> {
    // tslint:disable:variable-name
    private _internal: InternalActor;
    /** @hidden */
    public get internal() { return this._internal; }

    private _emitter: events.EventEmitter;
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
    private _materialId = ZeroGuid;
    // tslint:enable:variable-name

    /*
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
            value = null;
        }
        if (!this.context.actor(value)) {
            value = null; // throw?
        }
        this._parentId = value;
        this.actorChanged('parentId');
    }

    /** @returns A shared reference to this actor's material, or null if this actor has no material */
    public get material() { return this._context.assetManager.assets[this._materialId] as Material; }
    public set material(value) {
        this.materialId = value && value.id || ZeroGuid;
    }
    public get materialId() { return this._materialId; }
    public set materialId(value) {
        if (!value || value.startsWith('0000')) {
            value = ZeroGuid;
        }
        if (!this.context.assetManager.assets[value]) {
            value = ZeroGuid; // throw?
        }
        this._materialId = value;
        this.actorChanged('materialId');
    }

    // tslint:disable-next-line:variable-name
    private constructor(private _context: Context, private _id: string) {
        this._internal = new InternalActor(this);
        this._emitter = new events.EventEmitter();
        this._transform = new Transform();
        // Actor patching: Observe the transform for changed values.
        observe({
            target: this._transform,
            targetName: 'transform',
            notifyChanged: (...path: string[]) => this.actorChanged(...path)
        });
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
     * @param options.actor The initial state of the actor.
     */
    public static CreateEmpty(context: Context, options?: {
        actor?: Partial<ActorLike>,
        subscriptions?: SubscriptionType[]
    }): ForwardPromise<Actor> {
        return context.internal.CreateEmpty(options);
    }

    /**
     * Creates a new actor from a glTF resource.
     * @param context The SDK context object.
     * @param options.resourceUrl The URL of the source .gltf or .glb file.
     * @param options.assetName The name of the asset within the glTF to load. Leave empty to select the
     * first scene in the file.
     * @param options.colliderType The collider to assign to loaded objects. Leave blank for no colliders.
     * @param options.actor The initial state of the root actor.
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
     * @param options.resourceId The id of the library resource to instantiate.
     * @param options.actor The initial state of the root actor.
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
     * @param options.definiton @see PrimitiveDefinition
     * @param options.addCollder Whether or not to add a collider to the actor.
     * @param options.actor The initial state of the actor.
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
     * Creates a new actor hierarchy from the provided prefab.
     * @param context The SDK context object.
     * @param options.prefabId The ID of the prefab asset.
     * @param options.actor The initial state of the root actor.
     * given a collider type when loaded @see AssetManager.loadGltf.
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
    public created() {
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
    public enableLight(light?: Partial<LightLike>) {
        if (!light && this._light) {
            this.light.enabled = false;
        } else if (!this._light) {
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
        if (!rigidBody && this._rigidBody) {
            // TODO: Add `enabled` field
            // this.rigidBody.enabled = false;
        } else if (!this._rigidBody) {
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
    public enableText(text?: Partial<TextLike>) {
        if (!text && this._text) {
            this.text.enabled = false;
        } else if (!this._text) {
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
     * Starts playing a preloaded sound.
     * @param soundAssetId Name of sound asset preloaded using AssetManager.
     * @param options Adjustments to pitch and volume, and other characteristics.
     * @param startTimeOffset How many seconds to offset into the sound
     */
    public playSound(soundAssetId: string, options: SetSoundStateOptions,
                     startTimeOffset?: number): ForwardPromise<SoundInstance> {
        return createForwardPromise(new SoundInstance("SoundAssetHandle"),
            new Promise<SoundInstance>((resolve, reject) => {
                resolve();
            })
        );
        return;
    }

    /**
     * Loads a sound file and starts playing.
     * @param uri Path to a sound asset that needs to be loaded and played.
     * @param options Adjustments to pitch and volume, and other characteristics.
     * @param startTimeOffset How many seconds to offset into the sound
     */
    public loadAndPlaySound(uri: string, loadOptions: LoadSoundOptions,
                            playOptions: SetSoundStateOptions,
                            startTimeOffset?: number): ForwardPromise<SoundInstance> {
        return createForwardPromise(new SoundInstance("SoundAssetHandle"),
            new Promise<SoundInstance>((resolve, reject) => {
                resolve();
            })
        );
    }

    /**
     * Creates an animation on the actor.
     * @param animationName The name of the animation.
     * @param options The animation keyframes, events, and other characteristics.
     */
    public createAnimation(animationName: string, options: CreateAnimationOptions): Promise<void> {
        return this.context.internal.createAnimation(this.id, animationName, options);
    }

    /**
     * Enables the animation on the actor. Animation will start playing immediately.
     * @param animationName The name of the animation.
     */
    public enableAnimation(animationName: string) {
        this.setAnimationState(animationName, { enabled: true });
    }

    /**
     * Disables the animation on the actor. Animation will stop playing immediately.
     * When an animation is disabled, it is also paused (its time does not move forward).
     * @param animationName The name of the animation.
     */
    public disableAnimation(animationName: string) {
        this.setAnimationState(animationName, { enabled: false });
    }

    /**
     * Starts the animation (sets animation speed to 1).
     * @param animationName The name of the animation.
     */
    public resumeAnimation(animationName: string) {
        this.setAnimationState(animationName, { enabled: true });
    }

    /**
     * Stops the animation (sets animation speed to zero).
     * @param animationName The name of the animation.
     */
    public pauseAnimation(animationName: string) {
        this.setAnimationState(animationName, { enabled: false });
    }

    /**
     * Sets the animation time (units are in seconds).
     * @param animationName The name of the animation.
     * @param time The desired animation time. A negative value seeks to the end of the animation.
     */
    public setAnimationTime(animationName: string, time: number) {
        this.setAnimationState(animationName, { time });
    }

    /**
     * (Advanced) Sets the time, speed, and enabled state of an animation.
     * @param animationName The name of the animation.
     * @param options The time, speed and enabled state to apply. All values are optional. Only the values
     * provided will be applied.
     */
    public setAnimationState(animationName: string, state: SetAnimationStateOptions) {
        return this.context.internal.setAnimationState(this.id, animationName, state);
    }

    /**
     * Animate actor properties to the given value, following the specified animation curve. Actor transform
     * is the only animatable property at the moment. Other properties such as light color may become animatable
     * in the future.
     * @param value The desired final state of the animation.
     * @param duration The length of the interpolation (in seconds).
     * @param curve The cubic-bezier curve parameters. @see AnimationEaseCurves for predefined values.
     * @returns Returns a Promise that is resolves after the animation completes.
     */
    public animateTo(value: Partial<ActorLike>, duration: number, curve: number[]): Promise<void> {
        return this.context.internal.animateTo(this.id, value, duration, curve);
    }

    /**
     * Instruct the actor to face another object, or stop facing an object.
     * @param targetOrId The actor, user, or id of the object to face.
     * @param lookAtMode How to face the target. @see LookUpMode.
     */
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
        this.emitter.addListener(CollisionEventType.CollisionEnter, handler);
        return this;
    }

    /**
     * Add an event handler for the collision exit event.
     * @param handler The handler to call when the collision event is raised.
     */
    public onCollisionExit(handler: (collisionData: CollisionData) => any): this {
        this.context.internal.updateCollisionEventSubscriptions(this._id, { adds: CollisionEventType.CollisionExit });
        this.emitter.addListener(CollisionEventType.CollisionExit, handler);
        return this;
    }

    /**
     * Add an event handler for the trigger enter event.
     * @param handler The handler to call when the collision event is raised.
     */
    public onTriggerEnter(handler: (collisionData: CollisionData) => any): this {
        this.context.internal.updateCollisionEventSubscriptions(this._id, { adds: CollisionEventType.TriggerEnter });
        this.emitter.addListener(CollisionEventType.TriggerEnter, handler);
        return this;
    }

    /**
     * Add an event handler for the trigger exit event.
     * @param handler The handler to call when the collision event is raised.
     */
    public onTriggerExit(handler: (collisionData: CollisionData) => any): this {
        this.context.internal.updateCollisionEventSubscriptions(this._id, { adds: CollisionEventType.TriggerExit });
        this.emitter.addListener(CollisionEventType.TriggerExit, handler);
        return this;
    }

    /**
     * Set an event handler for the animation-disabled event.
     * @param handler The handler to call when an animation reaches the end or is otherwise disabled.
     */
    public onAnimationDisabled(handler: (animationName: string) => any): this {
        this.emitter.addListener('animation-disabled', handler);
        return this;
    }

    /**
     * Set an event handler for the animation-enabled event.
     * @param handler The handler to call when an animation moves from the disabled to enabled state.
     */
    public onAnimationEnabled(handler: (animationName: string) => any): this {
        this.emitter.addListener('animation-enabled', handler);
        return this;
    }

    public copy(from: Partial<ActorLike>): this {
        // Pause change detection while we copy the values into the actor.
        const wasObserving = this.internal.observing;
        this.internal.observing = false;

        if (!from) return this;
        if (from.id) this._id = from.id;
        if (from.parentId) this._parentId = from.parentId;
        if (from.name) this._name = from.name;
        if (from.tag) this._tag = from.tag;
        if (from.transform) this._transform.copy(from.transform);
        if (from.materialId) this._materialId = from.materialId;
        if (from.light) this.enableLight(from.light);
        if (from.rigidBody) this.enableRigidBody(from.rigidBody);
        // TODO @tombu:  Add in colliders here once feature is turned on.
        if (from.text) this.enableText(from.text);

        this.internal.observing = wasObserving;
        return this;
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
