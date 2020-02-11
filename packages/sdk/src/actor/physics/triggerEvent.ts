/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Guid } from '../../..';
import { TriggerEventType } from "./collisionEventType";

/**
 * A trigger event that has occured between physics objects.
 */
export interface TriggerEvent {
	colliderOwnerId: Guid;
	eventType: TriggerEventType;
	otherColliderOwnerId: Guid;
}
