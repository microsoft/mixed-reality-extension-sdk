/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from '../..';
import * as Payloads from '../../types/network/payloads';

export class SyncAsset {
	id: string;
	/** Used if asset was packaged with other assets */
	creationBatch: Message<Payloads.LoadAssets>;
	/** Used if asset was created from a definition */
	creationSimple: Message<Payloads.CreateAsset>;
	/** Used only with creationBatch, as definition is updated for other */
	update: Message<Payloads.AssetUpdate>;
}
