/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CollisionData, CollisionEventType } from ".";

/**
 * A collision event that has occured between physics objects.
 */
export interface CollisionEvent {
	colliderOwnerId: string;
	eventType: CollisionEventType;
	collisionData: CollisionData;
}
