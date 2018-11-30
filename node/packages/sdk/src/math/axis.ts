/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3 } from '.';

/** Defines the 3 main axes */
export class Axis {
    /** X axis */
    public static get X(): Vector3 { return new Vector3(1.0, 0.0, 0.0); }
    /** Y axis */
    public static get Y(): Vector3 { return new Vector3(0.0, 1.0, 0.0); }
    /** Z axis */
    public static get Z(): Vector3 { return new Vector3(0.0, 0.0, 1.0); }
}
