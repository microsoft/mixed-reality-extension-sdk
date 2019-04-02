/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionState, BehaviorType } from '.';
import { User } from '..';

export interface ActionEvent {
    user: User;
    targetId: string;
    behaviorType: BehaviorType;
    actionName: string;
    actionState: ActionState;
}
