/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Client } from '../../..';
import { Handshake } from '../../../protocols/handshake';
import { OperatingModel } from '../../../types/network/operatingModel';

/**
 * @hidden
 */
export class ClientHandshake extends Handshake {
    /** @override */
    public get name(): string { return `${this.constructor.name} client ${this.client.id.substr(0, 8)}`; }

    constructor(private client: Client, sessionId: string) {
        super(client.conn, sessionId, OperatingModel.PeerAuthoritative);
    }
}
