/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BehaviorType } from '.';
import { ActionState } from '.';

export interface ActionEvent {
    userId: string;
    targetId: string;
    behaviorType: BehaviorType;
    actionName: string;
    actionState: ActionState;
}
