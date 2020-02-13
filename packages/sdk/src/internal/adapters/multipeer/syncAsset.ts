/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Guid } from '../../..';
import { Message, Payloads } from '../../../internal';

/** @hidden */
export class SyncAsset {
	public id: Guid;
	/** Used if asset was packaged with other assets */
	public creatorMessageId: Guid;
	/** Used only with batch creation, as definition is updated for other */
	public update: Message<Payloads.AssetUpdate>;
	/** Used only for runtime instances (like MediaInstances) that need to know the duration of the asset */
	public duration?: number;
}
