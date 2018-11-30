/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Protocol, ServerPreprocessing } from '.';
import { ActionEvent, CollisionEvent, Context } from '..';
import {
    ActorUpdate,
    CollisionEventRaised,
    DestroyActors,
    EngineToAppRPC,
    MultiOperationResult,
    ObjectSpawned,
    OperationResult,
    PerformAction,
    StateUpdate,
    SyncRequest,
    Traces,
    UserJoined,
    UserLeft,
    UserUpdate,
} from '../types/network/payloads';
import { Sync } from './sync';

/**
 * @hidden
 * Class to handle operational messages with a client.
 */
export class Execution extends Protocol {
    constructor(private context: Context) {
        super(context);
        // Behave like a server-side endpoint (send heartbeats, measure connection quality)
        this.use(new ServerPreprocessing());
    }

    /** @private */
    public 'recv-engine2app-rpc' = (payload: EngineToAppRPC) => {
        this.emit('protocol.receive-rpc', payload.procName, payload.channelName, payload.args);
    }

    /** @private */
    public 'recv-object-spawned' = (payload: ObjectSpawned) => {
        this.emit('protocol.update-actors', payload.actors);
    }

    /** @private */
    public 'recv-state-update' = (update: StateUpdate) => {
        for (const payload of update.payloads) {
            this.recvPayload(payload);
        }
    }

    /** @private */
    public 'recv-actor-update' = (payload: ActorUpdate) => {
        this.emit('protocol.update-actors', [payload.actor]);
    }

    /** @private */
    public 'recv-destroy-actors' = (payload: DestroyActors) => {
        this.emit('protocol.destroy-actors', payload.actorIds);
    }

    /** @private */
    public 'recv-operation-result' = (operationResult: OperationResult) => {
        this.services.logger.log(operationResult.resultCode, operationResult.message || '');
        if (Array.isArray(operationResult.traces)) {
            operationResult.traces.forEach(trace => {
                this.services.logger.log(trace.severity, trace.message);
            });
        }
    }

    /** @private */
    public 'recv-multi-operation-result' = (multiOperationResult: MultiOperationResult) => {
        throw new Error("Not implemented");
    }

    /** @private */
    public 'recv-traces' = (payload: Traces) => {
        payload.traces.forEach(trace => {
            this.services.logger.log(trace.severity, trace.message);
        });
    }

    /** @private */
    public 'recv-user-joined' = (payload: UserJoined) => {
        this.emit('protocol.user-joined', payload.user);
    }

    /** @private */
    public 'recv-user-left' = (payload: UserLeft) => {
        this.emit('protocol.user-left', payload.userId);
    }

    /** @private */
    public 'recv-user-update' = (payload: UserUpdate) => {
        this.emit('protocol.update-user', payload.user);
    }

    /** @private */
    public 'recv-sync-request' = async (payload: SyncRequest) => {
        // Switch over to the Sync protocol to handle this request
        this.stopListening();

        const sync = new Sync(this.context);
        sync.on('protocol.sync-complete', () => {
            this.startListening();
        });
        sync.startListening();
    }

    /** @private */
    public 'recv-perform-action' = (payload: PerformAction) => {
        this.emit('protocol.perform-action', {
            userId: payload.userId,
            targetId: payload.targetId,
            behaviorType: payload.behaviorType,
            actionName: payload.actionName,
            actionState: payload.actionState
        } as ActionEvent);
    }

    public 'recv-collision-event-raised' = (payload: CollisionEventRaised) => {
        this.emit('protocol.collision-event-raised', {
            colliderOwnerId: payload.actorId,
            collisionEventType: payload.collisionEventType,
            collisionData: payload.collisionData
        } as CollisionEvent);
    }
}
