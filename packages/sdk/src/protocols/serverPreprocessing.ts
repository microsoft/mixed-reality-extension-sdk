/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Middleware } from '.';
import { Message } from '..';
import { ExportedPromise } from '../utils/exportedPromise';

/**
 * @hidden
 */
export class ServerPreprocessing implements Middleware {
    constructor() {
        this.beforeSend = this.beforeSend.bind(this);
    }

    /** @private */
    public beforeSend = (message: Message, promise?: ExportedPromise): Message => {
        message.serverTimeMs = message.serverTimeMs || Date.now();
        return message;
    }
}
