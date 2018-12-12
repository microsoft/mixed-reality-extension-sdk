/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Client } from '..';
import * as MRESDK from '../../..';
import * as Protocols from '../../../protocols';

/**
 * @hidden
 * Class for routing messages between the client and the session
 */
export class ClientExecution extends Protocols.Protocol implements Protocols.Middleware {
    private heartbeat: Protocols.Heartbeat;
    private heartbeatTimer: NodeJS.Timer;

    /** @override */
    public get name(): string { return `${this.constructor.name} client ${this.client.id}`; }

    constructor(private client: Client) {
        super(client.conn);
        this.heartbeat = new Protocols.Heartbeat(this);
        this.beforeRecv = this.beforeRecv.bind(this);
        // Behave like a server-side endpoint (send heartbeats, measure connection quality)
        this.use(new Protocols.ServerPreprocessing());
        // Use middleware to pipe client messages to the session.
        this.use(this);
    }

    public startListening() {
        super.startListening();
        if (!this.heartbeatTimer) {
            // Periodically measure connection latency.
            this.heartbeatTimer = this.setHeartbeatTimer();
        }
    }

    public stopListening() {
        clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = undefined;
        super.stopListening();
    }

    private setHeartbeatTimer(): NodeJS.Timer {
        return setTimeout(async () => {
            if (this.heartbeatTimer) {
                await this.heartbeat.send();
                this.heartbeatTimer = this.setHeartbeatTimer();
            }
            // Irregular heartbeats are a good thing in this instance.
        }, 1000 * (4 + 2 * Math.random()));
    }

    public beforeRecv = (message: MRESDK.Message): MRESDK.Message => {
        if (this.promises[message.replyToId]) {
            // If we have a queued promise for this message, let it through
            return message;
        } else {
            this.emit('recv', message);
            // Cancel the message
            return undefined;
        }
    }
}
