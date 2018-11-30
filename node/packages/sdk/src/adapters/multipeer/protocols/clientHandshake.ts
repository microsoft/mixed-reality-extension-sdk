/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Client } from '..';
import * as MRESDK from '../../..';
import { Handshake } from '../../../protocols/handshake';
import { OperatingModel } from '../../../types/network/operatingModel';
import { ExportedPromise } from '../../../utils/exportedPromise';

/**
 * @hidden
 */
export class ClientHandshake extends Handshake {
    /** @override */
    public get name(): string { return `${this.constructor.name} client ${this.client.id}`; }

    constructor(private client: Client) {
        super(client.services, OperatingModel.PeerAuthoritative);
    }

    /** @override */
    public sendMessage(message: MRESDK.Message, promise?: ExportedPromise) {
        if (message.payload.type === 'handshake-reply') {
            super.sendMessage(message, promise);
        } else if (!Client.ShouldIgnorePayloadWhileJoining(message.payload.type)) {
            this.client.queueMessage(message, promise);
        }
    }
}
