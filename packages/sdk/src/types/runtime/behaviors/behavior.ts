/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionState, BehaviorType, DiscreteAction } from '.';

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
        const action = (this as any)[actionName.toLowerCase()] as DiscreteAction;
        return action !== undefined;
    }

    /** @hidden */
    public _performAction(actionName: string, actionState: ActionState, userId: string): void {
        const action = (this as any)[actionName.toLowerCase()] as DiscreteAction;
        if (action) {
            action._setState(userId, actionState);
        }
    }
}
