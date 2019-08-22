/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionState, TriggeredAction } from '.';
import { Context, User } from '..';
import * as Payloads from '../../network/payloads';

/**
 * The action handler function type.
 */
export type ActionHandler = (user: User) => void;

export type ActionHandlerWithTriggeredAction = {
	handler?: ActionHandler;
	action?: TriggeredAction;
};

interface ActionHandlers {
	'started'?: ActionHandler;
	'stopped'?: ActionHandler;
}

/**
 * Class that represents a discrete action that can be in one of two states,
 * started or stopped for each user. @see ActionState
 */
export class DiscreteAction {
	private handlers: ActionHandlers = {};
	private activeUserIds: string[] = [];

	/** @hidden */
	constructor(private name: string) {
	}

	/**
	 * Add a handler for the given action state for when it is triggered.
	 * @param actionState The action state that the handle should be assigned to.
	 * @param handler The handler to call when the action state is triggered.
	 */
	public on(
		context: Context,
		actorId: string,
		actionState: ActionState,
		options: ActionHandler | ActionHandlerWithTriggeredAction): this {
		const handler = (typeof options === 'function') ? options : options.handler;
		this.handlers[actionState] = handler;
		if (typeof options === 'object') {
			context.internal.sendPayload({
				type: 'set-triggered-action',
				actorId,
				actionName: this.name,
				actionState,
				triggeredAction: options.action,
			} as Payloads.SetTriggeredAction);
		}
		return this;
	}

	/**
	 * Gets the current state of the action for the user with the given id.
	 * @param user The user to get the action state for.
	 * @returns The current state of the action for the user.
	 */
	public getState(user: User): ActionState {
		return this.activeUserIds.find(id => id === user.id) ?
			'started' : 'stopped';
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
	public _setState(user: User, actionState: ActionState): boolean {
		const currentState = this.activeUserIds.find(id => id === user.id) || 'stopped';
		if (currentState !== actionState) {
			if (actionState === 'started') {
				this.activeUserIds.push(user.id);
			} else {
				this.activeUserIds = this.activeUserIds.filter(id => id === user.id);
			}

			const handler = this.handlers[actionState];
			if (handler) {
				handler(user);
			}

			return true;
		}

		return false;
	}
}
