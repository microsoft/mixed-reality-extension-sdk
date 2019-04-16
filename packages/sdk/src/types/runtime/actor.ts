/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import events from 'events';
import {
    ActorTransform,
    ActorTransformLike,
    Appearance,
    AppearanceLike,
    Attachment,
    AttachmentLike,
    AttachPoint,
    Collider,
    ColliderLike,
    CollisionData,
    Light,
    LightLike,
    LookAt,
    LookAtLike,
    RigidBody,
    RigidBodyLike,
    Text,
    TextLike,
    User,
} from '.';
import {
    Context,
    CreateAnimationOptions,
    LookAtMode,
    PrimitiveDefinition,
    SetAnimationStateOptions,
    Vector3Like
} from '../..';
import { ZeroGuid } from '../../constants';
import { log } from '../../log';
import { SetSoundStateOptions } from '../../sound';
import { observe, unobserve } from '../../utils/observe';
import readPath from '../../utils/readPath';
import resolveJsonValues from '../../utils/resolveJsonValues';
import { ForwardPromise } from '../forwardPromise';
import { InternalActor } from '../internal/actor';
import { CollisionEventType, CreateColliderType } from '../network/payloads';
import { SubscriptionType } from '../network/subscriptionType';
import { Patchable } from '../patchable';
import { ActionHandler, ActionState, Behavior, DiscreteAction } from './behaviors';
import { BoxColliderGeometry, ColliderGeometry, SphereColliderGeometry } from './physics';
import { SoundInstance } from './soundInstance';

/**
 * Describes the properties of an Actor.
 */
export interface ActorLike {
    id: string;
    parentId: string;
    name: string;
    tag: string;
    exclusiveToUser: string | User;
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
    private _internal = new InternalActor(this);
    /** @hidden */
    public get internal() { return this._internal; }

    private _emitter = new events.EventEmitter();
    /** @hidden */
    public get emitter() { return this._emitter; }

    private _name: string;
    private _tag: string;
    private _exclusiveToUser: User;
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
    // tslint:enable:variable-name

    private get grab() { this._grab = this._grab || new DiscreteAction(); return this._grab; }

    /*
     * PUBLIC ACCESSORS
     */

    public get context() { return this._context; }
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get tag() { return this._tag; }
    public set tag(value) { this._tag = value; this.actorChanged('tag'); }
    public get exclusiveToUser(): User { return this.parent && this.parent.exclusiveToUser || this._exclusiveToUser; }
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
    public get parentId() { return this._parentId; }
    public set parentId(value) {
        if (!value || value.startsWith('0000') || !this.context.actor(value)) {
            value = ZeroGuid;
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

    // tslint:disable-next-line:variable-name
    private constructor(private _context: Context, private _id: string) {
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
     * @param center The center of the collider, or default of the object if none is provided.
     * @param radius The radius of the collider, or default bounding if non is provided.
     */
    // * @param collisionLayer The layer that the collider operates in.
    public setCollider(
        colliderType: 'sphere',
        // collisionLayer: CollisionLayer,
        isTrigger: boolean,
        center?: Vector3Like,
        radius?: number): void;

    /**
     * Adds a collider of the given type and parameters on the actor.
     * @param colliderType Type of the collider to enable.
     * @param isTrigger Whether the collider is a trigger volume or not.
     * @param center The center of the collider, or default of the object if none is provided.
     * @param size
     */
    public setCollider(
        colliderType: 'box',
        // collisionLayer: CollisionLayer,
        isTrigger: boolean,
        center?: Vector3Like,
        size?: Vector3Like): void;

    /** @ignore */
    public setCollider(
        colliderType: 'box' | 'sphere',
        // collisionLayer: CollisionLayer,
        isTrigger: boolean,
        center?: Vector3Like,
        size?: number | Vector3Like
    ): void {
        const colliderGeometry = this.generateColliderGeometry(colliderType, center, size);

        if (colliderGeometry) {
            this._setCollider({
                enabled: true,
                isTrigger,
                // collisionLayer,
                colliderGeometry
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
    public enableLookAt(actorOrActorId: Actor | string, mode?: LookAtMode, backward?: boolean) {
        // Resolve the actorId value.
        let actorId = ZeroGuid;
        if (typeof (actorOrActorId) === 'object' && actorOrActorId.id !== undefined) {
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
    public attach(userOrUserId: User | string, attachPoint: AttachPoint) {
        const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId.id;
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
        this.context.internal.updateSubscriptions(this.id, options);
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
     * @param startTimeOffset How many seconds to offset into the sound
     */
    public startSound(
        soundAssetId: string, options: SetSoundStateOptions,
        startTimeOffset?: number): ForwardPromise<SoundInstance> {
        return new SoundInstance(this, soundAssetId).start(options, startTimeOffset);
    }

    /**
     * Creates an animation on the actor.
     * @param animationName The name of the animation.
     * @param options The animation keyframes, events, and other characteristics.
     */
    public createAnimation(animationName: string, options: CreateAnimationOptions) {
        this.context.internal.createAnimation(this.id, animationName, options);
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
     */
    public animateTo(value: Partial<ActorLike>, duration: number, curve: number[]) {
        this.context.internal.animateTo(this.id, value, duration, curve);
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
        if (from.exclusiveToUser) {
            this._exclusiveToUser = typeof from.exclusiveToUser === 'string' ?
                this.context.user(from.exclusiveToUser) : from.exclusiveToUser;
        }
        if (from.transform) this._transform.copy(from.transform);
        if (from.attachment) this.attach(from.attachment.userId, from.attachment.attachPoint);
        if (from.appearance) this._appearance.copy(from.appearance);
        if (from.light) this.enableLight(from.light);
        if (from.rigidBody) this.enableRigidBody(from.rigidBody);
        if (from.collider) this._setCollider(from.collider);
        if (from.text) this.enableText(from.text);
        if (from.lookAt) this.enableLookAt(from.lookAt.actorId, from.lookAt.mode);
        if (from.grabbable) this._grabbable = from.grabbable;

        this.internal.observing = wasObserving;
        return this;
    }

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
     * Prepare outgoing messages
     * @hidden
     */
    public static sanitize(msg: ActorLike): ActorLike;
    public static sanitize(msg: Partial<ActorLike>): Partial<ActorLike>;
    public static sanitize(msg: ActorLike | Partial<ActorLike>): ActorLike | Partial<ActorLike> {
        msg = resolveJsonValues(msg);
        if (msg.exclusiveToUser && typeof msg.exclusiveToUser !== 'string') {
            msg.exclusiveToUser = msg.exclusiveToUser.id;
        }
        if (msg.appearance) {
            msg.appearance = Appearance.sanitize(msg.appearance);
        }
        return msg;
    }

    /**
     * PRIVATE METHODS
     */

    private actorChanged = (...path: string[]) => {
        if (this.internal.observing) {
            this.internal.patch = this.internal.patch || {} as ActorLike;
            readPath(this, this.internal.patch, ...path);
            this.context.internal.incrementGeneration();
        }
    }

    private generateColliderGeometry(
        colliderType: 'box' | 'sphere',
        center?: Vector3Like,
        size?: number | Vector3Like
    ): ColliderGeometry {
        switch (colliderType) {
            case 'box':
                return {
                    colliderType: 'box',
                    center,
                    size: size as Partial<Vector3Like>
                } as BoxColliderGeometry;
            case 'sphere':
                return {
                    colliderType: 'sphere',
                    center,
                    radius: size as number
                } as SphereColliderGeometry;

            default:
                log.error(null,
                    'Trying to enable a collider on the actor with an invalid collider geometry type.' +
                    `Type given is ${colliderType}`);

                return undefined;
        }
    }

    private _setCollider(collider: Partial<ColliderLike>) {
        if (this._collider) {
            unobserve(this._collider);
            this._collider = undefined;
        }

        this._collider = new Collider(this, collider);
        observe({
            target: this._collider,
            targetName: 'collider',
            notifyChanged: (...path: string[]) => this.actorChanged(...path),
            // Trigger notifications for every observed leaf node to ensure we get all values in the initial patch.
            triggerNotificationsNow: true
        });
    }
}
