/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TriggerEventType } from "./collisionEventType";

/**
 * A trigger event that has occured between physics objects.
 */
export interface TriggerEvent {
	colliderOwnerId: string;
	eventType: TriggerEventType;
	otherColliderOwnerId: string;
}
