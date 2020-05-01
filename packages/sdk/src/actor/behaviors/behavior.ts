/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionState, BehaviorType, Actionable } from '.';
import { User } from '../../user';

/**
 * Abstract class that serves as the base class for all behaviors.
 */
export abstract class Behavior {
	/**
	 * Gets the readonly behavior type for this behavior.
	 */
	public abstract get behaviorType(): BehaviorType;

	/**
	 * INTERNAL METHODS
	 */

	public _supportsAction(actionName: string): boolean {
		const action = (this as any)[`_${actionName.toLowerCase()}`] as Actionable;
		return action !== undefined;
	}

	/** @hidden */
	public _performAction(actionName: string, actionState: ActionState, user: User, actionData: any): void {
		const action = (this as any)[`_${actionName.toLowerCase()}`] as Actionable;
		if (action) {
			action._performAction(user, actionState, actionData);
		}
	}
}
