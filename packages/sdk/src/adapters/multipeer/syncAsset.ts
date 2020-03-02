/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from '../..';
import * as Payloads from '../../types/network/payloads';

/** @hidden */
export class SyncAsset {
	public id: string;
	/** Used if asset was packaged with other assets */
	public creatorMessageId: string;
	/** Used only with batch creation, as definition is updated for other */
	public update: Message<Payloads.AssetUpdate>;
	/** Used only for runtime instances (like MediaInstances) that need to know the duration of the asset */
	public duration?: number;
}
