/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Describes the ways in which an actor can face (point its local +Z axis toward) and track another object in the scene
 */
export enum LookAtMode {

    /**
     * Actor is world-locked and does not rotate
     */
    None = 'None',

    /**
     * Actor rotates around its Y axis to face the local user, offset by its rotation
     */
    LocalUserY = 'LocalUserY',

    /**
     * Actor rotates around its X and Y axes to face the local user, offset by its rotation
     */
    LocalUserXY = 'LocalUserXY'
}
