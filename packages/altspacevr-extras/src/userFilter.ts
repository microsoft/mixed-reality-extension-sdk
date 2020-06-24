/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

/** A callback that handles when a user joins or leaves the MRE session */
export type UserEntryExitCallback = (user: MRE.User) => void;

/** An event type for [[UserFilter.shouldForwardUserEvent]] */
export type UserInteractionType = 'joined' | 'input';

/** A class that has user joined/left callback hooks. Applies to MRE.Context, and also [[UserFilter]]s. */
export interface UserEntryExitPoint {
	onUserJoined(callback: UserEntryExitCallback): void;
	onUserLeft(callback: UserEntryExitCallback): void;
	offUserJoined(callback: UserEntryExitCallback): void;
	offUserLeft(callback: UserEntryExitCallback): void;
}

/** Base class for classes that filter out users from MRE awareness */
export abstract class UserFilter implements UserEntryExitPoint {
	private joinedCallbacks = new Set<UserEntryExitCallback>();
	private leftCallbacks = new Set<UserEntryExitCallback>();

	/** The set of IDs of joined users */
	protected joinedUsers = new Set<MRE.Guid>();

	/**
	 * Set up the user filter
	 * @param context An MRE.Context object, or another user filter instance
	 */
	constructor(protected context: UserEntryExitPoint) {
		this.context.onUserJoined(u => this.onUpstreamUserJoined(u));
		this.context.onUserLeft(u => this.onUpstreamUserLeft(u));
	}

	/** Register a callback that will be called when a user that passes the filter joins the MRE session */
	public onUserJoined(callback: UserEntryExitCallback) {
		this.joinedCallbacks.add(callback);
	}

	/** Deregister an [[onUserJoined]] callback */
	public offUserJoined(callback: UserEntryExitCallback) {
		this.joinedCallbacks.delete(callback);
	}

	/** Register a callback that will be called when a user that passes the filter leaves the MRE session */
	public onUserLeft(callback: UserEntryExitCallback) {
		this.leftCallbacks.add(callback);
	}

	/** Deregister an [[onUserLeft]] callback */
	public offUserLeft(callback: UserEntryExitCallback) {
		this.leftCallbacks.delete(callback);
	}

	/** Process an input event only from users that pass the filter */
	public filterInput(eventHandler: MRE.ActionHandler<any>): MRE.ActionHandler<any> {
		return (user: MRE.User, data: any) => {
			if (this.shouldForwardUserEvent(user, 'input')) {
				eventHandler(user, data);
			}
		};
	}

	/** Evaluates whether a user should be accepted by the filter for the given event type */
	protected abstract shouldForwardUserEvent(user: MRE.User, type: UserInteractionType): boolean;

	private onUpstreamUserJoined(user: MRE.User) {
		if (this.shouldForwardUserEvent(user, 'joined')) {
			this.joinedUsers.add(user.id);
			for (const cb of this.joinedCallbacks) {
				cb(user);
			}
		}
	}

	private onUpstreamUserLeft(user: MRE.User) {
		if (this.joinedUsers.has(user.id)) {
			this.joinedUsers.delete(user.id);
			for (const cb of this.leftCallbacks) {
				cb(user);
			}
		}
	}
}
