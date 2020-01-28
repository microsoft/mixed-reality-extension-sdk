/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Guid, Message } from '../..';
import * as Payloads from '../../types/network/payloads';

/** @hidden */
export class SyncAnimation {
	public id: Guid;
	/** Used if animation was packaged with others, i.e. part of a prefab */
	public creatorMessageId: Guid;
	/** Used only with batch creation, as definition is updated for other */
	public update: Message<Payloads.AnimationUpdate>;
	/** Used only for runtime instances that need to know the duration of the asset */
	public duration?: number;
}
