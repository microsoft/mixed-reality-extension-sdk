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
export class GroupMask extends Set<string> {
    public static readonly ALL_PACKED = ~0;
    public static readonly NONE_PACKED = 0;

    // tslint:disable-next-line:variable-name
    private _allowDefault = true;
    public get allowDefault() { return this._allowDefault; }
    public set allowDefault(val) {
        this._allowDefault = val;
        this.delete('default');
    }

    constructor(private context: Context, initialContents: Iterable<string> = null) {
        super();
        if (initialContents) {
            for (const group of initialContents) {
                if (this.allowDefault || group !== 'default') {
                    this.getOrAddMapping(group);
                    super.add(group);
                }
            }
        }
    }

    public static All(context: Context) {
        return this.FromPacked(context, this.ALL_PACKED);
    }

    public static FromPacked(context: Context, value: number): GroupMask {
        const group = new GroupMask(context);
        group.setPacked(value);
        return group;
    }

    public packed() {
        let pack = 0;
        for (const group of this) {
            pack |= this.getOrAddMapping(group);
        }
        if (pack === 0 && !this.allowDefault) {
            pack = this.getOrAddMapping('default');
        }
        return pack;
    }

    public toJSON() {
        return this.packed();
    }

    private getOrAddMapping(name: string): number {
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

    private changedCallback: (gm: GroupMask) => void;

    /** @hidden */
    public onChanged(callback: (gm: GroupMask) => void) {
        this.changedCallback = callback;
    }

    /** @hidden */
    public getClean() {
        return this.changedCallback === undefined ? this : new GroupMask(this.context, this);
    }

    public add(item: string) {
        if (this.allowDefault || item !== 'default') {
            super.add(item);
            if (this.changedCallback) {
                this.changedCallback(this);
            }
        }
        return this;
    }

    public addAll(items: Iterable<string>) {
        for (const i of items) {
            if (this.allowDefault || i !== 'default') {
                super.add(i);
            }
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

        if (!this.allowDefault) {
            value = value & ~this.getOrAddMapping('default');
        }
        for (const name of Object.keys(mapping)) {
            if ((value & this.getOrAddMapping(name)) !== 0) {
                super.add(name);
            }
        }
        if (this.changedCallback) {
            this.changedCallback(this);
        }
    }
}
