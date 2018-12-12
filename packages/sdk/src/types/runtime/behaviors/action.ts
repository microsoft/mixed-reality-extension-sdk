/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionState } from '.';

/**
 * The action handler function type.
 */
export type ActionHandler = (userId: string) => void;

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

    /**
     * Add a handler for the given action state for when it is triggered.
     * @param actionState The action state that the handle should be assigned to.
     * @param handler The handler to call when the action state is triggered.
     */
    public on(actionState: ActionState, handler: ActionHandler): this {
        this.handlers[actionState] = handler;
        return this;
    }

    /**
     * Gets the current state of the action for the user with the given id.
     * @param userId The id of the user to get the action state for.
     * @returns The current state of the action for the user.
     */
    public getState(userId: string): ActionState {
        return this.activeUserIds.find(id => id === userId) ?
            'started' : 'stopped';
    }

    /**
     * Get whether the action is active for the user with the given id.
     * @param userId - The id of the user to get whether the action is active for, or null
     * if active for any user is desired..
     * @returns - True if the action is active for the user, false if it is not.  In the case
     * that no user is given, the value is true if the action is active for any user, and false
     * if not.
     */
    public isActive(userId?: string): boolean {
        if (userId) {
            return !!this.activeUserIds.find(id => id === userId);
        } else {
            return this.activeUserIds.length > 0;
        }
    }

    /**
     * INTERNAL METHODS
     */

    /** @hidden */
    public _setState(userId: string, actionState: ActionState): boolean {
        const currentState = this.activeUserIds.find(id => id === userId) || 'stopped';
        if (currentState !== actionState) {
            if (actionState === 'started') {
                this.activeUserIds.push(userId);
            } else {
                this.activeUserIds = this.activeUserIds.filter(id => id === userId);
            }

            const handler = this.handlers[actionState];
            if (handler) {
                handler(userId);
            }

            return true;
        }

        return false;
    }
}
