/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from '../..';
import * as Payloads from '../../types/network/payloads';

export class SyncAsset {
	id: string;
	/** Used if asset was packaged with other assets */
	creatorMessageId: string;
	/** Used only with batch creation, as definition is updated for other */
	update: Message<Payloads.AssetUpdate>;
	/** Indicates that this asset has been unloaded, but we can't ditch this
	 * reference yet */
	unloaded: boolean = false;
}
