/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Context } from '../..';
import { InternalUser } from '../internal/user';
import UserGroupCollection from './userGroupCollection';

export interface UserLike {
    id: string;
    name: string;

    /** @hidden */
    groupsPacked: number;

    /**
     * A grab bag of miscellaneous, possibly host-dependent, properties.
     */
    properties: { [name: string]: string };
}

export interface UserSet {
    [id: string]: User;
}

export class User implements UserLike {
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
    public get groups() { return this._groups = this._groups || new UserGroupCollection(null, this._context); }
    public set groups(val: UserGroupCollection) {
        val.setContext(this._context);
        this._groups = val;
    }

    /**
     * Users cannot be explicitly added to the "default" group
     * @hidden
     */
    // tslint:disable-next-line:no-bitwise
    public get groupsPacked() { return this._groups ? this._groups.toJSON() & (~1) : 1; }

    /** @inheritdoc */
    public get properties() { return Object.freeze({ ...this._properties }); }

    /**
     * PUBLIC METHODS
     */

    // tslint:disable-next-line:variable-name
    constructor(private _context: Context, private _id: string) {
        this._internal = new InternalUser(this);
    }

    public copy(from: Partial<UserLike>): this {
        if (!from) return this;
        if (from.id !== undefined) this._id = from.id;
        if (from.name !== undefined) this._name = from.name;
        if (from.properties !== undefined) this._properties = from.properties;
        return this;
    }
}
