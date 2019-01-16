/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionEvent, Actor, ActorLike, Behavior, CollisionData, SetAnimationStateOptions } from '../..';
import { ExportedPromise } from '../../utils/exportedPromise';
import { CollisionEventType } from '../network/payloads';

/**
 * @hidden
 */
export class InternalActor {
    public observing = true;
    public patch: ActorLike;
    public behavior: Behavior;
    public createdPromises: ExportedPromise[];
    public created: boolean;
    public createAnimationPromises: { [name: string]: ExportedPromise[] };

    constructor(public actor: Actor) {
    }

    public performAction(actionEvent: ActionEvent) {
        const behavior = (this.behavior.behaviorType === actionEvent.behaviorType) ? this.behavior : undefined;
        if (behavior) {
            behavior._performAction(actionEvent.actionName, actionEvent.actionState, actionEvent.userId);
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
        if (this.created) {
            const patch = this.patch;
            if (patch) {
                patch.id = this.actor.id;
                delete this.patch;
            }
            return patch;
        }
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

    public notifyAnimationCreated(animationName: string, success: boolean, reason?: any): void {
        if (!!this.createAnimationPromises && !!this.createAnimationPromises[animationName]) {
            const createAnimationPromises = this.createAnimationPromises[animationName].splice(0);
            delete this.createAnimationPromises[animationName];
            for (const promise of createAnimationPromises) {
                if (success) {
                    promise.resolve();
                } else {
                    promise.reject(reason);
                }
            }
        }
    }

    public enqueueCreateAnimationPromise(animationName: string, promise: ExportedPromise): void {
        if (!this.createAnimationPromises) {
            this.createAnimationPromises = {};
        }
        if (!this.createAnimationPromises[animationName]) {
            this.createAnimationPromises[animationName] = [];
        }
        this.createAnimationPromises[animationName].push(promise);
    }

    public animationCreated(animationName: string): Promise<void> {
        if (!this.createAnimationPromises || !this.createAnimationPromises[animationName]) {
            return Promise.resolve();
        } else {
            return new Promise<void>((resolve, reject) =>
                this.enqueueCreateAnimationPromise(animationName, { resolve, reject }));
        }
    }
}
