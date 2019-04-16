/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Client, Rules } from '.';
import { Message } from '../..';
import { Middleware } from '../../protocols';
import { UserJoined } from '../../types/network/payloads';
import { ExportedPromise } from '../../utils/exportedPromise';

/**
 * Filter user-exclusive actors to a queue, then flush them after user-join
 * @hidden
 */
export class ClientDesyncPreprocessor implements Middleware {
    constructor(private client: Client) { }
    /** @hidden */
    public beforeSend(message: Message, promise?: ExportedPromise): Message {
        const payloadType = message.payload.type;
        const forUser = Rules[payloadType].client.shouldSendToUser(
            message, this.client.userId, this.client.session, this.client);
        if (forUser !== null && !this.client.userId) {
            // this message is user-exclusive, and the client's user ID is not yet settled,
            // queue and cancel send for now
            this.client.userExclusiveMessages.push({ message, promise });
        } else if (forUser !== false && this.client.userId) {
            // this message is intended for this client's user, send now
            return message;
        }
        // this message is intended for a different user, discard
    }

    /** @hidden */
    public beforeRecv(message: Message): Message {
        if (message.payload.type === 'user-joined') {
            const userJoin = message.payload as UserJoined;
            this.client.userId = userJoin.user.id;
            while (this.client.userExclusiveMessages.length > 0) {
                const queuedMsg = this.client.userExclusiveMessages.splice(0, 1)[0];
                this.client.send(queuedMsg.message, queuedMsg.promise);
            }
        }
        return message;
    }
}
