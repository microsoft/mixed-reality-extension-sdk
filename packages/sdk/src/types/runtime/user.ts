/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Context } from '../..';
import { InternalUser } from '../internal/user';
import UserGroup from '../userGroup';

export interface UserLike {
    id: string;
    name: string;

    /**
     * A bit field containing this user's group memberships.
     */
    packedGroups: number;

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
    // tslint:enable:variable-name

    /**
     * This user's group memberships.
     */
    public readonly groups = new UserGroup();

    public get context() { return this._context; }
    public get id() { return this._id; }
    public get name() { return this._name; }
    /** @inheritdoc */
    public get properties() { return Object.freeze({ ...this._properties }); }
    /** @inheritdoc */
    public get packedGroups() { return this.groups.packed(); }

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
