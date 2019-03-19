/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Context } from '.';

/**
 * A set of user group IDs. User groups are used to selectively enable several different
 * properties of actors based on the memberships of the viewing user. See [[User.groups]],
 * [[Appearance.enabled]].
 */
export default class UserGroup extends Set<string> {
    // tslint:disable:no-bitwise

    private context: Context;

    constructor(initialContents: Iterable<string> = null, context: Context = null) {
        super(initialContents);
        if (context) {
            this.setContext(context);
        }
    }

    public setContext(c: Context) {
        this.context = c;
        for (const group of this) {
            this.getOrAddMapping(group);
        }
    }

    public add(item: string): this {
        this.getOrAddMapping(item);
        super.add(item);
        return this;
    }

    public static FromPacked(context: Context, value: number): UserGroup {
        const mapping = context.internal.userGroupMapping;
        const group = new UserGroup(null, context);
        for (const name of Object.keys(mapping)) {
            if ((value & group.getOrAddMapping(name)) !== 0) {
                group.add(name);
            }
        }
        return group;
    }

    public toJSON(): number {
        let pack = 0;
        for (const group of this) {
            pack |= this.getOrAddMapping(group);
        }
        return pack;
    }

    private getOrAddMapping(name: string): number {
        if (!this.context) {
            throw new Error("Cannot manipulate a user group without associating it with a context first");
        }

        const mapping = this.context.internal.userGroupMapping;
        if (!mapping[name]) {
            const lastIndex = Object.keys(mapping).length;
            // according to MDN, 2^52 is the largest pow2 that can be stored in a number primitive
            if (lastIndex > 52) {
                throw new Error(`User group count limit reached! Failed to add new user group "${name}"`);
            }
            mapping[name] = 1 << lastIndex;
        }

        return mapping[name];
    }
}
