/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Flags to constrain rigid body motion.
 */
export enum RigidBodyConstraints {
	None = 'none',
	FreezePositionX = 'freeze-position-x',
	FreezePositionY = 'freeze-position-y',
	FreezePositionZ = 'freeze-position-z',
	FreezePosition = 'freeze-position',
	FreezeRotationX = 'freeze-rotation-x',
	FreezeRotationY = 'freeze-rotation-y',
	FreezeRotationZ = 'freeze-rotation-z',
	FreezeRotation = 'freeze-rotation',
	FreezeAll = 'freeze-all',
}
