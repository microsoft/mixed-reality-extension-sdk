/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { GroupMask } from './groupMask';

/**
 * A collection of user group IDs. Unlike in [[GroupMask]], users in these groups are **excluded** from this mask
 * instead of included.
 */
export class InvertedGroupMask extends GroupMask {
	/** @hidden */
	public packed() {
		return ~super.packed();
	}

	/** @hidden */
	public setPacked(value: number) {
		super.clear();
		const mapping = this.context.internal.userGroupMapping;

		if (!this.allowDefault) {
			value = value & ~this.getOrAddMapping('default');
		}
		for (const name of Object.keys(mapping)) {
			if ((value & this.getOrAddMapping(name)) === 0) {
				super.add(name);
			}
		}
		if (this.changedCallback) {
			this.changedCallback(this);
		}
	}

	/** Convert this from a mask containing everything but these groups to a mask containing only these groups. */
	public invert() {
		return new GroupMask(this.context, this);
	}
}
