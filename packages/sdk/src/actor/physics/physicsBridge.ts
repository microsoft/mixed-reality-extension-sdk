/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Guid } from "../../util";
import { TransformLike } from "../transform";

export interface PhysicsBridgeTransformInfo {
    id: Guid;
    motionType: number;
    transform: Partial<TransformLike>;
}

export interface PhysicsBridgeTransformUpdate {
    id: Guid;
    time: number;
    transformCount: number;
    transforms: string;
}
