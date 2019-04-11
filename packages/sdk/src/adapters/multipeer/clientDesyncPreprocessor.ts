/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Client } from '.';
import { Middleware } from '../../protocols';
import { Message } from '../..';
import { ExportedPromise } from '../../utils/exportedPromise';

/**
 * Filter user-exclusive actors to a queue, then flush them after user-join
 * @hidden
 */
export class ClientDesyncPreprocessor implements Middleware {
    constructor(private client: Client) { }
    /** @hidden */
    public beforeSend(message: Message, promise?: ExportedPromise): Message {
        return message;
    }
}
