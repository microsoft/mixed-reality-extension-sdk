/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CollisionEventType } from "../../network/payloads";
import { CollisionData } from "./collision";

/**
 * A collision event that has occured between physics objects.
 */
export interface CollisionEvent {
    colliderOwnerId: string;
    collisionEventType: CollisionEventType;
    collisionData: CollisionData;
}
