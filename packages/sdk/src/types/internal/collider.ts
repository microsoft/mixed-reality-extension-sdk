/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from "events";
import {
	Actor,
	Collider,
	ColliderEventType,
	CollisionData,
	CollisionHandler,
	TriggerHandler
} from "../runtime";

/** @hidden */
export class InternalCollider {
	// tslint:disable:variable-name
	private _eventHandlers = new EventEmitter();
	private _eventSubCount = 0;
	// tslint:enable:variable-name

	/** @hidden */
	public get eventSubscriptions(): ColliderEventType[] {
		return this._eventHandlers.eventNames() as ColliderEventType[];
	}

	/** @hidden */
	constructor(public collider: Collider, private $owner: Actor) {
	}

	/** @hidden */
	public on(event: ColliderEventType, handler: CollisionHandler | TriggerHandler) {
		this._eventHandlers.addListener(event, handler);
		this.updateEventSubscriptions();
	}

	/** @hidden */
	public off(event: ColliderEventType, handler: CollisionHandler | TriggerHandler) {
		this._eventHandlers.removeListener(event, handler);
		this.updateEventSubscriptions();
	}

	/** @hidden */
	public eventReceived(event: ColliderEventType, payload: CollisionData | Actor) {
		this._eventHandlers.emit(event, payload);
	}

	private updateEventSubscriptions() {
		const newSubCount = this._eventHandlers.eventNames().length;
		if (this._eventSubCount !== newSubCount) {
			// Notifty that event handler subscriptions has changed.
			this.$owner.actorChanged('collider', 'eventSubscriptions');
			this._eventSubCount = newSubCount;
		}
	}
}
