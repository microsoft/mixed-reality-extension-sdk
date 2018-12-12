/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Transform, TransformLike } from '.';
import { Context } from '../..';
import BufferedEventEmitter from '../../utils/bufferedEventEmitter';
import EventEmitterLike from '../../utils/eventEmitterLike';
import { InternalUser } from '../internal/user';
import { SubscriptionType } from '../network/subscriptionType';
import observe from './observe';

export interface UserLike {
    id: string;
    name: string;
    transform: TransformLike;
    subscriptions: SubscriptionType[];
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
    // tslint:enable:variable-name

    public get context() { return this._context; }
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get transform() { return this._transform; }
    public get subscriptions() { return this._subscriptions; }

    /**
     * PUBLIC METHODS
     */

    // tslint:disable-next-line:variable-name
    constructor(private _context: Context, private _id: string) {
        this._internal = new InternalUser(this);
        this._transform = new Transform();
    }

    public copyDirect(user: Partial<UserLike>): this {
        if (!user) {
            return this;
        }
        if (typeof user.id !== 'undefined') {
            this._id = user.id;
        }
        if (typeof user.name !== 'undefined') {
            this._name = user.name;
        }
        if (typeof user.transform !== 'undefined') {
            this._transform.copyDirect(user.transform);
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

    public toJSON() {
        return {
            id: this.id,
            name: this.name,
            transform: this.transform.toJSON(),
            subscriptions: this.subscriptions,
        } as UserLike;
    }
}
