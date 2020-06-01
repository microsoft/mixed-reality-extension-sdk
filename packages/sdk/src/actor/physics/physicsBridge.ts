/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Guid } from "../../util";

export type PhysicsBridgeTransformUpdate = {
    id: Guid;
    time: number;
    transformCount: number;
    transformsBlob: string;
}
