/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Context, GroupMask } from '../..';
import readPath from '../../utils/readPath';
import { InternalUser } from '../internal/user';
import { Patchable } from '../patchable';

export interface UserLike {
	id: string;
	name: string;
	groups: number | GroupMask;
	properties: { [name: string]: string };
}

export interface UserSet {
	[id: string]: User;
}

/**
 * The structure returned from [[User.prompt]].
 */
export type DialogResponse = {
	/** Whether the user replied in the positive (OK/Accept) or in the negative (Cancel). */
	submitted: boolean;
	/** The string provided by the user in the dialog text input field. */
	text?: string;
};

export class User implements UserLike, Patchable<UserLike> {
	private _internal: InternalUser;
	/** @hidden */
	public get internal() { return this._internal; }

	private _name: string;
	private _properties: { [name: string]: string };
	private _groups: GroupMask;

	public get context() { return this._context; }
	public get id() { return this._id; }
	public get name() { return this._name; }

	/**
	 * This user's group memberships. Some actors will behave differently depending on
	 * if the user is in at least one of a set of groups. See [[GroupMask]].
	 */
	public get groups() {
		if (!this._groups) {
			this._groups = new GroupMask(this._context);
			this._groups.allowDefault = false;
			this._groups.onChanged(() => this.userChanged('groups'));
		}
		return this._groups;
	}
	public set groups(val) {
		if (!val) {
			if (this._groups) {
				this._groups.clear();
			}
			return;
		}

		this._groups = val.getClean();
		this._groups.allowDefault = false;
		this._groups.onChanged(() => this.userChanged('groups'));
		this.userChanged('groups');
	}

	/**
	 * A grab bag of miscellaneous, possibly host-dependent, properties.
	 */
	public get properties() { return Object.freeze({ ...this._properties }); }

	/**
	 * PUBLIC METHODS
	 */

	constructor(private _context: Context, private _id: string) {
		this._internal = new InternalUser(this, this._context.internal);
	}

	/**
	 * Present the user with a modal dialog, and resolve with the response.
	 * @param text A message presented to the user.
	 * @param acceptInput Whether or not the dialog should include a text input field.
	 */
	public prompt(text: string, acceptInput = false): Promise<DialogResponse> {
		return this.internal.prompt(text, acceptInput);
	}

	public copy(from: Partial<UserLike>): this {
		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		if (!from) { return this; }
		if (from.id !== undefined) { this._id = from.id; }
		if (from.name !== undefined) { this._name = from.name; }
		if (from.properties !== undefined) { this._properties = from.properties; }
		if (from.groups !== undefined) {
			if (typeof from.groups === 'number') {
				this.groups.setPacked(from.groups);
			} else {
				this.groups = from.groups;
			}
		}

		this.internal.observing = wasObserving;
		return this;
	}

	public toJSON() {
		return {
			id: this.id,
			name: this.name,
			groups: this.groups.packed(),
			properties: this.properties,
		} as UserLike;
	}

	private userChanged(...path: string[]) {
		if (this.internal.observing) {
			this.internal.patch = this.internal.patch || {} as UserLike;
			readPath(this, this.internal.patch, ...path);
			this.context.internal.incrementGeneration();
		}
	}
}
