/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Guid } from "../../util";

export type PhysicsBridgeTransformUpdate = {
    id: Guid;
    time: number;
    transformCount: number;
    flags: number;
    transformsBlob: string;
}

export type PhysicsServerTransformsUpdate = {
    id: Guid;
    transformCount: number;
    transformsBlob: string;
}
