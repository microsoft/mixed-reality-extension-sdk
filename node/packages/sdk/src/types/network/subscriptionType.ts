/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * A type representing the different parts of an Actor that can be subscribed to. When subscribed, the Actor will
 * receive updates when corresponding changes occur on the host.
 */
export type SubscriptionType = 'transform' | 'rigidbody' | 'collider';

/**
 * The kinds of objects that can specified when subscribing (obsolete now).
 */
export type SubscriptionOwnerType = 'actor' | 'user';
