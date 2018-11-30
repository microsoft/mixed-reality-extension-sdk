/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionHandler, ActionState, Behavior, BehaviorType, DiscreteAction } from '.';

/**
 * Target behavior class containing the target behavior actions.
 */
export class TargetBehavior extends Behavior {
    // tslint:disable:variable-name
    private _behaviorType: BehaviorType = 'target';
    private _target: DiscreteAction = new DiscreteAction();
    // tslint:enable:variable-name

    /** @inheritdoc */
    public get behaviorType() { return this._behaviorType; }

    public get target() { return this._target; }

    /**
     * Add a target handler to be called when the given target state is triggered.
     * @param targetState The target state to fire the handler on.
     * @param handler The handler to call when the target state is triggered.
     * @return This target behavior.
     */
    public onTarget(targetState: 'enter' | 'exit', handler: ActionHandler): this {
        const actionState: ActionState = (targetState === 'enter') ? 'started' : 'stopped';
        this._target.on(actionState, handler);
        return this;
    }

    /**
     * Gets whether the behavior is being targeted by the given user, or at all if no user id is given.
     * @param userId The id of the user to check whether they are targeting this behavior.
     * @return True if the user is targeting this behavior, false if not.  In the case where no user id is given, this
     * returns true if any user is targeting this behavior, false if none are.
     */
    public isTargeted(userId?: string): boolean {
        return this._target.isActive(userId);
    }
}
