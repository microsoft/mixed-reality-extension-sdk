/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionEvent, CollisionEvent, Context, log, TriggerEvent, } from '../..';
import { Message, Payloads, Protocols, WebSocket } from '../../internal';

/**
 * @hidden
 * Class to handle operational messages with a client.
 */
export class Execution extends Protocols.Protocol {
	constructor(private context: Context) {
		super(context.conn);
		// Behave like a server-side endpoint (send heartbeats, measure connection quality)
		this.use(new Protocols.ServerPreprocessing());
	}

	/** @override */
	protected missingPromiseForReplyMessage(message: Message) {
		// Ignore. App receives reply messages from all clients, but only processes the first one.
	}

	/** @private */
	public 'recv-engine2app-rpc' = (payload: Payloads.EngineToAppRPC) => {
		this.emit('protocol.receive-rpc', payload);
	};

	/** @private */
	public 'recv-object-spawned' = (payload: Payloads.ObjectSpawned) => {
		this.emit('protocol.update-actors', payload.actors);
		this.emit('protocol.update-animations', payload.animations);
	};

	/** @private */
	public 'recv-actor-update' = (payload: Payloads.ActorUpdate) => {
		this.emit('protocol.update-actors', [payload.actor]);
	};

	/** @private */
	public 'recv-destroy-actors' = (payload: Payloads.DestroyActors) => {
		this.emit('protocol.destroy-actors', payload.actorIds);
	};

	/** @private */
	public 'recv-operation-result' = (operationResult: Payloads.OperationResult) => {
		log.log('network', operationResult.resultCode, operationResult.message);
		if (Array.isArray(operationResult.traces)) {
			operationResult.traces.forEach(trace => {
				log.log('network', trace.severity, trace.message);
			});
		}
	};

	/** @private */
	public 'recv-multi-operation-result' = (multiOperationResult: Payloads.MultiOperationResult) => {
		throw new Error("Not implemented");
	};

	/** @private */
	public 'recv-traces' = (payload: Payloads.Traces) => {
		payload.traces.forEach(trace => {
			log.log('client', trace.severity, trace.message);
		});
	};

	/** @private */
	public 'recv-user-joined' = (payload: Payloads.UserJoined) => {

		const props = payload.user.properties = payload.user.properties || {};
		props.host = props.host || 'unspecified';
		props.engine = props.engine || 'unspecified';

		if (this.conn instanceof WebSocket && !props.remoteAddress) {
			props.remoteAddress = this.conn.remoteAddress;
		}

		this.emit('protocol.user-joined', payload.user);
	};

	/** @private */
	public 'recv-user-left' = (payload: Payloads.UserLeft) => {
		this.emit('protocol.user-left', payload.userId);
	};

	/** @private */
	public 'recv-user-update' = (payload: Payloads.UserUpdate) => {
		this.emit('protocol.update-user', payload.user);
	};

	/** @private */
	public 'recv-sync-request' = async (payload: Payloads.SyncRequest) => {
		// Switch over to the Sync protocol to handle this request
		this.stopListening();

		const sync = new Protocols.Sync(this.conn);
		await sync.run(); // Allow exception to propagate.

		this.startListening();
	};

	/** @private */
	public 'recv-perform-action' = (payload: Payloads.PerformAction) => {
		this.emit('protocol.perform-action', {
			user: this.context.user(payload.userId),
			targetId: payload.targetId,
			behaviorType: payload.behaviorType,
			actionName: payload.actionName,
			actionState: payload.actionState
		} as ActionEvent);
	};

	/** @private */
	public 'recv-collision-event-raised' = (payload: Payloads.CollisionEventRaised) => {
		this.emit('protocol.collision-event-raised', {
			colliderOwnerId: payload.actorId,
			eventType: payload.eventType,
			collisionData: payload.collisionData
		} as CollisionEvent);
	};

	/** @private */
	public 'recv-trigger-event-raised' = (payload: Payloads.TriggerEventRaised) => {
		this.emit('protocol.trigger-event-raised', {
			colliderOwnerId: payload.actorId,
			eventType: payload.eventType,
			otherColliderOwnerId: payload.otherActorId
		} as TriggerEvent);
	};

	/** @private */
	public 'recv-set-animation-state' = (payload: Payloads.SetAnimationState) => {
		this.emit('protocol.set-animation-state',
			payload.actorId,
			payload.animationName,
			payload.state);
	};
}
