/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CreateActorCommon } from '.';

/** @hidden */
export type SyncPayloadType = 'x-reserve-actor';

/**
 * @hidden
 * Send a message to the multipeer adapter to save the given actor in the session
 */
export type XReserveActor = CreateActorCommon & {
	type: 'x-reserve-actor';
};
