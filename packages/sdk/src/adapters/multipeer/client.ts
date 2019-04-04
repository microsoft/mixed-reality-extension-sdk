/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';
import UUID from 'uuid/v4';
import { ClientExecution, ClientHandshake, ClientSync, MissingRule, Rules, Session } from '.';
import { Connection, Message } from '../..';
import { log } from '../../log';
import * as Protocols from '../../protocols';
import * as Payloads from '../../types/network/payloads';
import { ExportedPromise } from '../../utils/exportedPromise';
import filterEmpty from '../../utils/filterEmpty';

/**
 * @hidden
 */
export type QueuedMessage = {
    message: Message;
    promise?: ExportedPromise;
};

/**
 * @hidden
 * Class representing a connection to an engine client
 */
export class Client extends EventEmitter {
    private static orderSequence = 0;

    // tslint:disable:variable-name
    private _id: string;
    private _session: Session;
    private _protocol: Protocols.Protocol;
    private _order: number;
    private _queuedMessages: QueuedMessage[] = [];
    private _authoritative = false;
    // tslint:enable:variable-name

    public get id() { return this._id; }
    public get order() { return this._order; }
    public get protocol() { return this._protocol; }
    public get session() { return this._session; }
    public get conn() { return this._conn; }
    public get authoritative() { return this._authoritative; }
    public get queuedMessages() { return this._queuedMessages; }

    public userId: string;

    /**
     * Creates a new Client instance
     */
    // tslint:disable-next-line:variable-name
    constructor(private _conn: Connection) {
        super();
        this._id = UUID();
        this._order = Client.orderSequence++;
        this.leave = this.leave.bind(this);
        this._conn.on('close', this.leave);
        this._conn.on('error', this.leave);
    }

    public setAuthoritative(value: boolean) {
        this._authoritative = value;
        this.protocol.sendPayload({
            type: 'set-authoritative',
            authoritative: value
        } as Payloads.SetAuthoritative);
    }

    /**
     * Syncs state with the client
     */
    public async join(session: Session) {
        try {
            this._session = session;
            // Sync state to the client
            const sync = this._protocol = new ClientSync(this);
            await sync.run();
            // Join the session as a user
            const execution = this._protocol = new ClientExecution(this);
            execution.on('recv', (message) => this.emit('recv', this, message));
            execution.startListening();
        } catch (e) {
            log.error('network', e);
            this.leave();
        }
    }

    public leave() {
        try {
            if (this._protocol) {
                this._protocol.stopListening();
                this._protocol = undefined;
            }
            this._conn.off('close', this.leave);
            this._conn.off('error', this.leave);
            this._conn.close();
            this._session = undefined;
            this.emit('close');
        } catch { }
    }

    public isJoined() {
        return this.protocol && this.protocol.constructor.name === "ClientExecution";
    }

    public send(message: Message, promise?: ExportedPromise) {
        if (this.protocol) {
            this.protocol.sendMessage(message, promise);
        } else {
            // tslint:disable-next-line:no-console
            log.error('network', `[ERROR] No protocol for message send: ${message.payload.type}`);
        }
    }

    public sendPayload(payload: Partial<Payloads.Payload>, promise?: ExportedPromise) {
        if (this.protocol) {
            this.protocol.sendPayload(payload, promise);
        } else {
            // tslint:disable-next-line:no-console
            log.error('network', `[ERROR] No protocol for payload send: ${payload.type}`);
        }
    }

    public queueMessage(message: Message, promise?: ExportedPromise) {
        const rule = Rules[message.payload.type] || MissingRule;
        const beforeQueueMessageForClient = rule.client.beforeQueueMessageForClient || (() => message);
        message = beforeQueueMessageForClient(this.session, this, message, promise);
        if (message) {
            // tslint:disable-next-line:max-line-length
            log.verbose('network', `Client ${this.id.substr(0, 8)} queue id:${message.id.substr(0, 8)}, type:${message.payload.type}`);
            log.verbose('network-content', JSON.stringify(message, (key, value) => filterEmpty(value)));
            this.queuedMessages.push({ message, promise });
        }
    }

    public filterQueuedMessages(callbackfn: (value: QueuedMessage) => any) {
        const filteredMessages: QueuedMessage[] = [];
        this._queuedMessages = this._queuedMessages.filter((value) => {
            const allow = callbackfn(value);
            if (allow) {
                filteredMessages.push(value);
            }
            return !allow;
        });
        return filteredMessages;
    }
}
