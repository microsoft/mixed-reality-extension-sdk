/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerPreprocessing } from '.';
import { Services } from '..';
import { OperatingModel } from '../types/network/operatingModel';
import * as Payloads from '../types/network/payloads';
import { Protocol } from './protocol';

/**
 * @hidden
 * Class to manage the handshake process with a client.
 */
export class Handshake extends Protocol {
    constructor(services: Services, private operatingModel: OperatingModel) {
        super(services);
        // Behave like a server-side endpoint (send heartbeats, measure connection quality)
        this.use(new ServerPreprocessing());
    }

    /** @private */
    public 'recv-handshake' = (payload: Payloads.Handshake) => {
        this.sendPayload({
            type: 'handshake-reply',
            sessionId: this.services.sessionId,
            operatingModel: this.operatingModel,
        } as Payloads.HandshakeReply);
    }

    /** @private */
    public 'recv-handshake-complete' = (payload: Payloads.HandshakeComplete) => {
        this.stopListening();
        this.emit('protocol.handshake-complete');
    }
}
