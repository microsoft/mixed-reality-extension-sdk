/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The trigger events that can be raised on a collider.
 */
export type TriggerEventType = 'trigger-enter' | 'trigger-exit';

/**
 * The collision events that can be raised on a collider.
 */
export type CollisionEventType = 'collision-enter' | 'collision-exit';

/**
 * Used for the network payloads.
 * @hidden
 */
export type ColliderEventType = TriggerEventType | CollisionEventType;
