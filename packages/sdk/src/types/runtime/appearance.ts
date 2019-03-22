/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, GroupMask, Material } from '.';
import { ZeroGuid } from '../../constants';

export interface AppearanceLike {
    /**
     * This actor's visibility preference, independent of its parent. If this property is a
     * GroupMask object, this property will effectively be `true` for users in at least one
     * of the groups, and `false` for everyone else. See [[GroupMask]].
     */
    enabled: boolean | GroupMask;

    /** @hidden */
    enabledPacked: number;

    /**
     * The ID of a previously-created [[Material]] asset.
     */
    materialId: string;
}

export class Appearance implements AppearanceLike {
    /** @hidden */
    public $DoNotObserve = ['actor', '_enabledFor'];

    // tslint:disable:variable-name
    private _enabledPacked = GroupMask.ALL_PACKED; // authoritative
    private _enabledFor: GroupMask; // cached object, synced with _enabledPacked
    private _materialId = ZeroGuid;
    // tslint:enable:variable-name

    /**
     * This actor's visibility preference, independent of its parent. See [[Appearance.activeAndEnabled]] for
     * the computed visibility state. If this property is a GroupMask object, this property will
     * effectively be `true` for users in at least one of the groups, and `false` for everyone else.
     * See [[GroupMask]].
     */
    public get enabled(): boolean | GroupMask {
        if (this.enabledPacked === GroupMask.ALL_PACKED) {
            return true;
        } else if (this.enabledPacked === GroupMask.NONE_PACKED) {
            return false;
        } else {
            return this.enabledFor;
        }
    }
    public set enabled(value: boolean | GroupMask) {
        if (value === true) {
            this.enabledPacked = GroupMask.ALL_PACKED;
        } else if (value === false) {
            this.enabledPacked = GroupMask.NONE_PACKED;
        } else {
            this.enabledFor = value;
        }
    }

    /**
     * [[enabled]], but forced to a [[GroupMask]]. Using this property will convert this
     * actor's `enabled` property to the GroupMask equivalent of its current value relative
     * to the current set of used groups.
     */
    public get enabledFor() {
        if (!this._enabledFor) {
            this._enabledFor = GroupMask.FromPacked(this.actor.context, this._enabledPacked);
            this._enabledFor.onChanged(gm => this._enabledPacked = gm.packed());
        }
        return this._enabledFor;
    }
    public set enabledFor(value) {
        this.enabledPacked = value.packed();
        this._enabledFor = value;
        this._enabledFor.onChanged(gm => this._enabledPacked = gm.packed());
    }

    /** @hidden */
    public get enabledPacked() { return this._enabledPacked; }
    public set enabledPacked(value: number) {
        this._enabledPacked = value;
        if (this._enabledFor) {
            this._enabledFor.setPacked(value);
        }
    }

    /** Whether this actor is visible */
    public get activeAndEnabled(): boolean {
        return (!this.actor.parent || this.actor.parent.appearance.activeAndEnabled)
            && this._enabledPacked !== GroupMask.NONE_PACKED;
    }

    /** @returns A shared reference to this actor's material, or null if this actor has no material */
    public get material() { return this.actor.context.assetManager.assets[this._materialId] as Material; }
    public set material(value) {
        this.materialId = value && value.id || ZeroGuid;
    }

    /** @inheritdoc */
    public get materialId() { return this._materialId; }
    public set materialId(value) {
        if (!value || value.startsWith('0000')) {
            value = ZeroGuid;
        }
        if (!this.actor.context.assetManager.assets[value]) {
            value = ZeroGuid; // throw?
        }
        this._materialId = value;
    }

    constructor(private actor: Actor) { }

    public copy(from: Partial<AppearanceLike>): this {
        if (!from) return this;
        if (from.materialId !== undefined) this.materialId = from.materialId;
        if (from.enabledPacked !== undefined) {
            this.enabledPacked = from.enabledPacked;
        } else if (typeof from.enabled === 'number') {
            // redirect masks that got into the enabled field
            this.enabledPacked = from.enabled;
        } else if (from.enabled !== undefined) {
            this.enabled = from.enabled;
        }
        return this;
    }

    public toJSON() {
        return {
            enabledPacked: this.enabledPacked,
            materialId: this.materialId
        } as AppearanceLike;
    }
}
