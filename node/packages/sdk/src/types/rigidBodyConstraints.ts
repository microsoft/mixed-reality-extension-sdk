/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Flags to constrain rigid body motion.
 */
export enum RigidBodyConstraints {
    None = 'None',
    FreezePositionX = 'FreezePositionX',
    FreezePositionY = 'FreezePositionY',
    FreezePositionZ = 'FreezePositionZ',
    FreezePosition = 'FreezePosition',
    FreezeRotationX = 'FreezeRotationX',
    FreezeRotationY = 'FreezeRotationY',
    FreezeRotationZ = 'FreezeRotationZ',
    FreezeRotation = 'FreezeRotation',
    FreezeAll = 'FreezeAll',
}
