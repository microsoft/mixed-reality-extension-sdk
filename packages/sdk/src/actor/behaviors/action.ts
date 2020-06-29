/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionState, Guid, User } from '../..';

/**
 * The action handler function type.
 */
export type ActionHandler<ActionDataT = void> = (user: User, actionData?: ActionDataT) => void;

/**
 * @hidden
 */
export interface Actionable {
	_performAction(user: User, actionState: ActionState, actionData?: any): boolean;
}

interface ActionHandlers<ActionDataT = void> {
	'started'?: ActionHandler<ActionDataT>;
	'stopped'?: ActionHandler<ActionDataT>;
	'performing'?: ActionHandler<ActionDataT>;
}

/**
 * Class that represents a discrete action that can be in one of two states,
 * started or stopped for each user. @see ActionState
 */
export class DiscreteAction<ActionDataT = void> implements Actionable {
	private handlers: ActionHandlers<ActionDataT> = {};
	private activeUserIds: Guid[] = [];

	/**
	 * Add a handler for the given action state for when it is triggered.
	 * @param actionState The action state that the handle should be assigned to.
	 * @param handler The handler to call when the action state is triggered.
	 */
	public on(actionState: ActionState, handler: ActionHandler<ActionDataT>): this {
		this.handlers[actionState] = handler;
		return this;
	}

	/**
	 * Gets the current state of the action for the user with the given id.
	 * @param user The user to get the action state for.
	 * @returns The current state of the action for the user.
	 */
	public getState(user: User): ActionState {
		return this.activeUserIds.find(id => id === user.id) ?
			'performing' : 'stopped';
	}

	/**
	 * Get whether the action is active for the user with the given id.
	 * @param user - The user to get whether the action is active for, or null
	 * if active for any user is desired..
	 * @returns - True if the action is active for the user, false if it is not.  In the case
	 * that no user is given, the value is true if the action is active for any user, and false
	 * if not.
	 */
	public isActive(user?: User): boolean {
		if (user) {
			return !!this.activeUserIds.find(id => id === user.id);
		} else {
			return this.activeUserIds.length > 0;
		}
	}

	/**
	 * INTERNAL METHODS
	 */

	/** @hidden */
	public _performAction(user: User, actionState: ActionState, actionData?: any): boolean {
		const currentState = this.activeUserIds.find(id => id === user.id) || 'stopped';
		if (currentState !== actionState) {
			if (actionState === 'started') {
				this.activeUserIds.push(user.id);
			} else if (actionState === 'stopped') {
				this.activeUserIds = this.activeUserIds.filter(id => id === user.id);
			}

			const handler = this.handlers[actionState];
			if (handler) {
				handler(user, actionData);
			}

			return true;
		}

		return false;
	}
}
