/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionHandler, Guid, User } from '..';

/** A callback that handles when a user joins or leaves the MRE session */
export type UserEntryExitCallback = (user: User) => void;

/** An event type for [[UserFilter.shouldForwardUserEvent]] */
export type UserInteractionType = 'joined' | 'input';

/** A class that has user joined/left callback hooks. Applies to [[Context]], and also [[UserFilter]]s. */
export interface UserEntryExitPoint {
	users: User[];
	onUserJoined(callback: UserEntryExitCallback): void;
	onUserLeft(callback: UserEntryExitCallback): void;
	offUserJoined(callback: UserEntryExitCallback): void;
	offUserLeft(callback: UserEntryExitCallback): void;
}

/** Base class for classes that filter out users from MRE awareness */
export abstract class UserFilter implements UserEntryExitPoint {
	private joinedCallbacks = new Set<UserEntryExitCallback>();
	private leftCallbacks = new Set<UserEntryExitCallback>();

	/** The set of joined users, indexed by ID */
	protected joinedUsers = new Map<Guid, User>();

	/** The set of joined users */
	public get users() {
		return [...this.joinedUsers.values()];
	}

	/**
	 * Set up the user filter
	 * @param context An MRE.Context object, or another user filter instance
	 */
	constructor(protected context: UserEntryExitPoint) {
		for (const u of context.users) {
			if (this.shouldForwardUserEvent(u, 'joined')) {
				this.joinedUsers.set(u.id, u);
			}
		}
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
	public filterInput<T = null>(eventHandler: ActionHandler<T>): ActionHandler<T> {
		return (user: User, data: T) => {
			if (this.shouldForwardUserEvent(user, 'input')) {
				eventHandler(user, data);
			}
		};
	}

	/** Evaluates whether a user should be accepted by the filter for the given event type */
	protected abstract shouldForwardUserEvent(user: User, type: UserInteractionType): boolean;

	private onUpstreamUserJoined(user: User) {
		if (this.shouldForwardUserEvent(user, 'joined')) {
			this.joinedUsers.set(user.id, user);
			for (const cb of this.joinedCallbacks) {
				cb(user);
			}
		}
	}

	private onUpstreamUserLeft(user: User) {
		if (this.joinedUsers.has(user.id)) {
			this.joinedUsers.delete(user.id);
			for (const cb of this.leftCallbacks) {
				cb(user);
			}
		}
	}
}
