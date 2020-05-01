/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Actionable,
	ActionEvent,
	Actor,
	ActorLike,
	Behavior,
	CollisionData,
	CollisionEventType,
	TriggerEventType
} from '..';
import {
	ExportedPromise,
	InternalPatchable
} from '../internal';
import { ColliderInternal } from './physics/colliderInternal';

/**
 * @hidden
 */
export class ActorInternal implements InternalPatchable<ActorLike> {
	public observing = true;
	public patch: ActorLike;
	public behavior: Behavior;
	public createdPromises: ExportedPromise[];
	public created: { success: boolean; reason?: any };

	public get collider(): ColliderInternal {
		return this.actor.collider ? this.actor.collider.internal : undefined;
	}

	constructor(public actor: Actor) {
	}

	public performAction(actionEvent: ActionEvent) {
		const behavior = (this.behavior && this.behavior.behaviorType === actionEvent.behaviorType)
			? this.behavior : undefined;
		if (behavior && behavior._supportsAction(actionEvent.actionName)) {
			behavior._performAction(actionEvent.actionName, actionEvent.actionState, actionEvent.user, actionEvent.actionData);
		} else {
			const action = (this.actor as any)[actionEvent.actionName.toLowerCase()] as Actionable;
			if (action) {
				action._performAction(actionEvent.user, actionEvent.actionState, actionEvent.actionData);
			}
		}
	}

	public collisionEventRaised(collisionEventType: CollisionEventType, collisionData: CollisionData) {
		if (this.collider) {
			this.collider.eventReceived(collisionEventType, collisionData);
		}
	}

	public triggerEventRaised(triggerEventType: TriggerEventType, otherActor: Actor) {
		if (this.collider) {
			this.collider.eventReceived(triggerEventType, otherActor);
		}
	}

	public getPatchAndReset(): ActorLike {
		const patch = this.patch;
		if (patch) {
			patch.id = this.actor.id;
			delete this.patch;
			return Actor.sanitize(patch);
		}
	}

	public notifyCreated(success: boolean, reason?: any): void {
		this.created = { success, reason };
		if (this.createdPromises) {
			const createdPromises = this.createdPromises;
			delete this.createdPromises;
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
		this.createdPromises = this.createdPromises || [];
		this.createdPromises.push(promise);
	}
}
