/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionState, BehaviorType, Guid, User } from '../..';

export interface ActionEvent {
	user: User;
	targetId: Guid;
	behaviorType: BehaviorType;
	actionName: string;
	actionState: ActionState;
	actionData?: any;
}
