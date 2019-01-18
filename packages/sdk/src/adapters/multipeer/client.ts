/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import deepmerge from 'deepmerge';
import { EventEmitter } from 'events';
import UUID from 'uuid/v4';
import { ClientExecution, ClientHandshake, ClientSync, Session } from '.';
import * as MRESDK from '../..';
import * as Protocols from '../../protocols';
import * as Payloads from '../../types/network/payloads';
import { ExportedPromise } from '../../utils/exportedPromise';
import { log } from './../../log';

interface QueuedMessage {
    message: MRESDK.Message;
    promise?: ExportedPromise;
}

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
    // tslint:enable:variable-name

    private queuedMessages: QueuedMessage[] = [];

    public get id() { return this._id; }
    public get order() { return this._order; }
    public get protocol() { return this._protocol; }
    public get session() { return this._session; }
    public get conn() { return this._conn; }
    public get authoritative() {
        return (0 === this.session.clients.sort((a, b) => a.order - b.order)
            .findIndex(client => client.id === this.id));
    }

    public userId: string;

    /**
     * Creates a new Client instance
     */
    // tslint:disable-next-line:variable-name
    constructor(private _conn: MRESDK.Connection) {
        super();
        this._id = UUID();
        this._order = Client.orderSequence++;
        this.leave = this.leave.bind(this);
        this._conn.on('close', this.leave);
        this._conn.on('error', this.leave);
    }

    /**
     * Syncs state with the client
     */
    public join(session: Session): Promise<void> {
        this._session = session;
        return new Promise<void>((resolve, reject) => {
            // Handshake with the client
            const handshake = this._protocol = new ClientHandshake(this);
            handshake.on('protocol.handshake-complete', () => {
                // Sync state to the client
                const sync = this._protocol = new ClientSync(this);
                sync.on('protocol.sync-complete', () => {
                    // Join the session as a user
                    const execution = this._protocol = new ClientExecution(this);
                    execution.on('recv', (message) => this.emit('recv', this, message));
                    execution.startListening();
                    resolve();
                });
                sync.startListening();
            });
            handshake.startListening();
        });
    }

    public leave() {
        this._protocol.stopListening();
        this._conn.off('close', this.leave);
        this._conn.off('error', this.leave);
        this._conn.close();
        this._session = undefined;
        this._protocol = undefined;
        this.emit('close');
    }

    public joinedOrLeft(): Promise<void> {
        if (this.protocol && this.protocol.constructor.name === "ClientExecution") {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const test = () =>
                (!this.protocol || this.protocol.constructor.name === "ClientExecution") ? resolve() : set();
            const set = () => setTimeout(test, 25);
            set();
        });
    }

    public send(message: MRESDK.Message, promise?: ExportedPromise) {
        if (this.protocol) {
            this.protocol.sendMessage(message, promise);
        } else {
            log.error('network', `No protocol for message send: ${message.payload.type}`);
        }
    }

    public sendPayload(payload: Partial<Payloads.Payload>, promise?: ExportedPromise) {
        if (this.protocol) {
            this.protocol.sendPayload(payload, promise);
        } else {
            log.error('network', `No protocol for payload send: ${payload.type}`);
        }
    }

    public queueMessage(message: MRESDK.Message, promise?: ExportedPromise) {
        if (message.payload.type === 'actor-update' || message.payload.type === 'actor-correction') {
            const actorUpdate = message.payload as Partial<Payloads.ActorUpdate>;
            const queuedMessage = this.queuedMessages
                .filter(value =>
                    (value.message.payload.type === 'actor-update' ||
                    value.message.payload.type === 'actor-correction') &&
                    (value.message.payload as Partial<Payloads.ActorUpdate>).actor.id === actorUpdate.actor.id).shift();
            if (queuedMessage) {
                // tslint:disable-next-line
                // console.log("COALESCEING QUEUED ACTOR STATE: " + JSON.stringify(message));
                const existingUpdate = queuedMessage.message.payload as Partial<Payloads.ActorUpdate>;
                existingUpdate.actor = deepmerge(existingUpdate.actor, actorUpdate.actor);
                return;
            }
        }
        // tslint:disable-next-line
        // console.log("QUEUING MESSAGE: " + JSON.stringify(message));
        this.queuedMessages.push({ message, promise });
    }

    public async syncQueuedMessages() {
        // tslint:disable-next-line
        // console.log("BEGIN SYNCING QUEUED MESSAGES");
        while (this.queuedMessages.length) {
            const queuedMessages = this.queuedMessages.splice(0);
            for (const queuedMessage of queuedMessages) {
                this.send(queuedMessage.message, queuedMessage.promise);
            }
            await this.protocol.drainPromises();
        }
        // tslint:disable-next-line
        // console.log("END SYNCING QUEUED MESSAGES");
    }

    public static ShouldIgnorePayloadWhileJoining(type: string): boolean {
        // Ignore "create" payloads while joining, since all created things will be synchronized
        // from the ClientSync protocol.
        return type.startsWith('create-') || type.startsWith('load-');
    }
}
