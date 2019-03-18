/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

let lastIndex = 0;
const groupIndex: { [name: string]: number } = {};

/**
 * A set of user group IDs. User groups are used to selectively enable several different
 * properties of [[Actor]]s based on the memberships of the viewing [[User]]. See [[User.groups]],
 * [[Appearance.enabled]], and [[Collider.enabled]].
 */
export default class UserGroup extends Set<string> {
    constructor(initialContents: string[] = []) {
        super(initialContents);
    }

    public add(item: string): this {
        if (!groupIndex[item]) {
            // according to MDN, 2^52 is the largest pow2 that can be stored in a number primitive
            if (lastIndex > 52) {
                throw new Error(`Global user group count limit reached! Failed to add new user group "${item}"`);
            }
            groupIndex[item] = 1 << lastIndex++;
        }

        super.add(item);
        return this;
    }

    public packed(): number {
        let pack = 0;
        for (const group of this) {
            pack |= groupIndex[group];
        }
        return pack;
    }

    public addPacked(value: number): this {
        for (const group of Object.keys(groupIndex)) {
            if ((value & groupIndex[group]) !== 0) {
                this.add(group);
            }
        }
        return this;
    }
}
