/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionState, BehaviorType, DiscreteAction } from '.';
import { Context, User } from '..';

/**
 * Abstract class that serves as the base class for all behaviors.
 */
export abstract class Behavior {
	/**
	 * Gets the readonly behavior type for this behavior.
	 */
	public abstract get behaviorType(): BehaviorType;

	/** @hidden */
	public get context() { return this._context; }
	/** @hidden */
	public get actorId() { return this._actorId; }

	/** @hidden */
	// tslint:disable-next-line: variable-name
	constructor(private _context: Context, private _actorId: string) {
	}

	/**
	 * INTERNAL METHODS
	 */

	/** @hidden */
	public _supportsAction(actionName: string): boolean {
		const action = (this as any)[actionName.toLowerCase()] as DiscreteAction;
		return action !== undefined;
	}

	/** @hidden */
	public _performAction(actionName: string, actionState: ActionState, user: User): void {
		const action = (this as any)[actionName.toLowerCase()] as DiscreteAction;
		if (action) {
			action._setState(user, actionState);
		}
	}
}
