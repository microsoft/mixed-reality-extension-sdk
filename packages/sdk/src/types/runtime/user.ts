/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Transform, TransformLike } from '.';
import { Context } from '../..';
import { InternalUser } from '../internal/user';
import { SubscriptionType } from '../network/subscriptionType';

export interface UserLike {
    id: string;
    name: string;
    transform: TransformLike;
    subscriptions: SubscriptionType[];

    /**
     * A grab bag of miscellaneous, possibly host-dependent, properties.
     */
    properties: { [name: string]: any };
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
    private _transform: Transform;
    private _subscriptions: SubscriptionType[] = [];
    private _properties: { [name: string]: any };
    // tslint:enable:variable-name

    public get context() { return this._context; }
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get transform() { return this._transform; }
    public get subscriptions() { return this._subscriptions; }
    /** @inheritdoc */
    public get properties() { return Object.freeze({ ...this._properties }); }

    /**
     * PUBLIC METHODS
     */

    // tslint:disable-next-line:variable-name
    constructor(private _context: Context, private _id: string) {
        this._internal = new InternalUser(this);
        this._transform = new Transform();
    }

    public copy(from: Partial<UserLike>): this {
        if (!from) {
            return this;
        }
        if (from.id !== undefined) {
            this._id = from.id;
        }
        if (from.name !== undefined) {
            this._name = from.name;
        }
        if (from.transform !== undefined) {
            this._transform.copy(from.transform);
        }
        if (from.properties !== undefined) {
            this._properties = from.properties;
        }
        return this;
    }

    public subscribe(subscription: SubscriptionType) {
        this.updateSubscriptions({
            adds: [subscription],
            removes: [],
        });
    }

    public unsubscribe(subscription: SubscriptionType) {
        this.updateSubscriptions({
            adds: [],
            removes: [subscription],
        });
    }

    public updateSubscriptions(options: {
        adds: SubscriptionType | SubscriptionType[],
        removes: SubscriptionType | SubscriptionType[],
    }) {
        const adds = Array.isArray(options.adds) ? options.adds : [options.adds];
        const removes = Array.isArray(options.removes) ? options.removes : [options.removes];
        this._subscriptions = this._subscriptions.filter(subscription => removes.indexOf(subscription) < 0);
        this._subscriptions.push(...adds);
        this.context.internal.updateSubscriptions(this.id, 'user', options);
    }
}
