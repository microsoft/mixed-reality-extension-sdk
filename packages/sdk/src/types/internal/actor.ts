/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ActionEvent,
    Actor,
    ActorLike,
    Behavior,
    CollisionData,
    DiscreteAction,
    SetAnimationStateOptions } from '../..';
import { ExportedPromise } from '../../utils/exportedPromise';
import { CollisionEventType } from '../network/payloads';
import { InternalPatchable } from '../patchable';

/**
 * @hidden
 */
export class InternalActor implements InternalPatchable<ActorLike> {
    public observing = true;
    public patch: ActorLike;
    public behavior: Behavior;
    public createdPromises: ExportedPromise[];
    public created: boolean;

    constructor(public actor: Actor) {
    }

    public performAction(actionEvent: ActionEvent) {
        const behavior = (this.behavior.behaviorType === actionEvent.behaviorType) ? this.behavior : undefined;
        if (behavior && behavior._supportsAction(actionEvent.actionName)) {
            behavior._performAction(actionEvent.actionName, actionEvent.actionState, actionEvent.userId);
        } else {
            const action = (this.actor as any)[actionEvent.actionName.toLowerCase()] as DiscreteAction;
            if (action) {
                action._setState(actionEvent.userId, actionEvent.actionState);
            }
        }
    }

    public collisionEventRaised(collisionEventType: CollisionEventType, collisionData: CollisionData) {
        if (this.actor) {
            this.actor.emitter.emit(collisionEventType, collisionData);
        }
    }

    public setAnimationStateEventRaised(animationName: string, state: SetAnimationStateOptions) {
        if (this.actor) {
            if (state.enabled !== undefined) {
                if (state.enabled) {
                    this.actor.emitter.emit('animation-enabled', animationName);
                } else {
                    this.actor.emitter.emit('animation-disabled', animationName);
                }
            }
        }
    }

    public getPatchAndReset(): ActorLike {
        const patch = this.patch;
        if (patch) {
            patch.id = this.actor.id;
            delete this.patch;
        }
        return patch;
    }

    public notifyCreated(success: boolean, reason?: any): void {
        this.created = true;
        if (this.createdPromises) {
            const createdPromises = this.createdPromises.splice(0);
            this.createdPromises = undefined;
            for (const promise of createdPromises) {
                if (success) {
                    promise.resolve();
                } else {
                    promise.reject(reason);
                }
            }
        }
    }

    public enqueueCreatedPromise(promise: ExportedPromise): void {
        if (!this.createdPromises) {
            this.createdPromises = [];
        }
        this.createdPromises.push(promise);
    }
}
