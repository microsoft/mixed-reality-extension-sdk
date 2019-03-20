/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Context } from '.';

// tslint:disable:no-bitwise

/**
 * A set of user group IDs. User groups are used to selectively enable several different
 * properties of actors based on the memberships of the viewing user. All users not assigned
 * a group are in the `default` group. See [[User.groups]], [[Appearance.enabled]].
 */
export default class UserGroupCollection extends Set<string> {
    public static readonly ALL_PACKED = ~0;
    public static readonly NONE_PACKED = 0;

    private context: Context;

    constructor(initialContents: Iterable<string> = null, context: Context = null) {
        super(initialContents);
        if (context) {
            this.setContext(context);
        }
    }

    public static All(context: Context) {
        return this.FromPacked(context, this.ALL_PACKED);
    }

    public static FromPacked(context: Context, value: number): UserGroupCollection {
        const group = new UserGroupCollection(null, context);
        group.setPacked(value);
        return group;
    }

    /** @hidden */
    public setContext(c: Context) {
        this.context = c;
        for (const group of this) {
            this.getOrAddMapping(group);
        }
    }

    public packed() {
        let pack = 0;
        for (const group of this) {
            pack |= this.getOrAddMapping(group);
        }
        return pack;
    }

    public toJSON() {
        return this.packed();
    }

    private getOrAddMapping(name: string): number {
        if (!this.context) {
            throw new Error("Cannot serialize a user group without associating it with a context first");
        }

        const mapping = this.context.internal.userGroupMapping;
        if (!mapping[name]) {
            const lastIndex = Object.keys(mapping).length;
            // all bitwise inputs are coerced to 32-bit signed ints
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
            if (lastIndex >= 32) {
                throw new Error(`User group count limit reached! Failed to add new user group "${name}"`);
            }
            mapping[name] = 1 << lastIndex;
        }

        return mapping[name];
    }

    /*
     * Observable considerations
     */

    private changedCallback: (coll: UserGroupCollection) => void;

    /** @hidden */
    public onChanged(callback: (ugc: UserGroupCollection) => void) {
        this.changedCallback = callback;
    }

    public add(item: string) {
        super.add(item);
        if (this.changedCallback) {
            this.changedCallback(this);
        }
        return this;
    }

    public addAll(items: Iterable<string>) {
        for (const i of items) {
            super.add(i);
        }
        if (this.changedCallback) {
            this.changedCallback(this);
        }
        return this;
    }

    public delete(item: string) {
        const ret = super.delete(item);
        if (ret && this.changedCallback) {
            this.changedCallback(this);
        }
        return ret;
    }

    public clear() {
        super.clear();
        if (this.changedCallback) {
            this.changedCallback(this);
        }
    }

    public set(items: Iterable<string>) {
        super.clear();
        this.addAll(items);
    }

    public setPacked(value: number) {
        super.clear();
        const mapping = this.context.internal.userGroupMapping;
        for (const name of Object.keys(mapping)) {
            const inSet = (value & this.getOrAddMapping(name));
            console.log(`${value} & ${this.getOrAddMapping(name)} === ${inSet}`);
            if (inSet !== 0) {
                super.add(name);
            }
        }
        if (this.changedCallback) {
            this.changedCallback(this);
        }
    }
}
