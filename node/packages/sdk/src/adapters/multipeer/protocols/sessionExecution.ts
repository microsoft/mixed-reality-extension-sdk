/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Session } from '..';
import * as MRESDK from '../../../';
import * as Protocols from '../../../protocols';

/**
 * @hidden
 * Class for routing messages from the app over to the session
 */
export class SessionExecution extends Protocols.Protocol implements Protocols.Middleware {
    constructor(private session: Session) {
        super(session.services);
        this.beforeRecv = this.beforeRecv.bind(this);
        // Behave like a client-side endpoint (record latency, respond to heartbeats).
        this.use(new Protocols.ClientPreprocessing(this));
        // Use middleware to take incoming messages from the app and pipe them to the session.
        this.use(this);
    }

    /** @private */
    public beforeRecv = (message: MRESDK.Message): MRESDK.Message => {
        // Notify listeners we received a message from the application
        this.emit('recv', message);
        // Cancel the message
        return undefined;
    }
}
