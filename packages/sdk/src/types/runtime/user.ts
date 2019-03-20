/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Context } from '../..';
import readPath from '../../utils/readPath';
import { InternalUser } from '../internal/user';
import { Patchable } from '../patchable';
import UserGroupCollection from './userGroupCollection';

export interface UserLike {
    id: string;
    name: string;
    groups: number | UserGroupCollection;
    properties: { [name: string]: string };
}

export interface UserSet {
    [id: string]: User;
}

export class User implements UserLike, Patchable<UserLike> {
    // tslint:disable:variable-name
    private _internal: InternalUser;
    /** @hidden */
    public get internal() { return this._internal; }

    private _name: string;
    private _properties: { [name: string]: string };
    private _groups: UserGroupCollection;
    // tslint:enable:variable-name

    public get context() { return this._context; }
    public get id() { return this._id; }
    public get name() { return this._name; }

    /**
     * This user's group memberships. Some actors will behave differently depending on
     * if the user is in at least one of a set of groups. See [[UserGroup]].
     */
    public get groups() {
        if (!this._groups) {
            this._groups = new UserGroupCollection(null, this._context);
            this._groups.onChanged(() => this.userChanged('groups'));
        }
        return this._groups;
    }
    public set groups(val) {
        this._groups = val;
        if (this._groups) {
            this._groups.setContext(this._context);
            this._groups.onChanged(() => this.userChanged('groups'));
        }
        this.userChanged('groups');
    }

    // Note: users cannot be explicitly added to the "default" group
    // tslint:disable-next-line:no-bitwise
    private get groupsPacked() { return this._groups ? this._groups.packed() & (~1) : 1; }
    private set groupsPacked(value: number) {
        this.groups.setPacked(value);
    }

    /**
     * A grab bag of miscellaneous, possibly host-dependent, properties.
     */
    public get properties() { return Object.freeze({ ...this._properties }); }

    /**
     * PUBLIC METHODS
     */

    // tslint:disable-next-line:variable-name
    constructor(private _context: Context, private _id: string) {
        this._internal = new InternalUser(this);
    }

    public copy(from: Partial<UserLike>): this {
        // Pause change detection while we copy the values into the actor.
        const wasObserving = this.internal.observing;
        this.internal.observing = false;

        if (!from) return this;
        if (from.id !== undefined) this._id = from.id;
        if (from.name !== undefined) this._name = from.name;
        if (from.properties !== undefined) this._properties = from.properties;
        if (from.groups !== undefined) {
            if (typeof from.groups === 'number') {
                this.groupsPacked = from.groups;
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
            groups: this.groupsPacked,
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
