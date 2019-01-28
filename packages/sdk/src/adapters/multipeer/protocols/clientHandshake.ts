/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Client, MissingRule, Rules } from '..';
import { Message } from '../../..';
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
        super(client.conn, client.session.sessionId, OperatingModel.PeerAuthoritative);
    }

    /**
     * @override
     * Handle the outgoing message according to the handshake rules specified for this payload.
     */
    public sendMessage(message: Message, promise?: ExportedPromise) {
        const rule = Rules[message.payload.type] || MissingRule;
        const handling = rule.handshake.during;
        // tslint:disable-next-line:switch-default
        switch (handling) {
            case 'allow': {
                super.sendMessage(message, promise);
                break;
            }
            case 'queue': {
                this.client.queueMessage(message, promise);
                break;
            }
            case 'ignore': {
                break;
            }
            case 'error': {
                // tslint:disable-next-line:no-console
                console.log(`[ERROR] ${this.name}: Invalid message for send during handshake: ${message.payload.type}`);
            }
        }
    }
}
