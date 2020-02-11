/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExportedPromise, Message, Protocols } from '../../internal';

/**
 * @hidden
 */
export class ServerPreprocessing implements Protocols.Middleware {
	constructor() {
		this.beforeSend = this.beforeSend.bind(this);
	}

	/** @private */
	public beforeSend = (message: Message, promise?: ExportedPromise): Message => {
		message.serverTimeMs = message.serverTimeMs || Date.now();
		return message;
	};
}
