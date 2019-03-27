/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ColliderEventType, CollisionData } from ".";

/**
 * A collision event that has occured between physics objects.
 */
export interface CollisionEvent {
    colliderOwnerId: string;
    collisionEventType: ColliderEventType;
    collisionData: CollisionData;
}
