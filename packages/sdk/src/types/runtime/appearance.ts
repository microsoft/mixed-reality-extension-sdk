/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, Material } from '.';
import { ZeroGuid } from '../../constants';
import UserGroup from './userGroup';

export interface AppearanceLike {
    enabled: boolean | UserGroup;
    materialId: string;
}

export class Appearance implements AppearanceLike {
    /** @hidden */
    public $DoNotObserve = ['activeAndEnabled', 'actor', 'material'];

    // tslint:disable:variable-name
    private _materialId = ZeroGuid;
    // tslint:enable:variable-name

    /**
     * This actor's visibility preference, independent of its parent. See [[activeAndEnabled]] for
     * the computed visibility state. If this property is a UserGroup object, this property will effectively
     * be `true` for users in at least one of the groups, and `false` for everyone else. See [[UserGroup]].
     */
    public enabled: boolean | UserGroup = true;

    /** Whether this actor is visible */
    public get activeAndEnabled(): boolean {
        return (!this.actor.parent || this.actor.parent.appearance.activeAndEnabled) &&
            (this.enabled === true || (this.enabled as UserGroup).size > 0);
    }

    /** @returns A shared reference to this actor's material, or null if this actor has no material */
    public get material() { return this.actor.context.assetManager.assets[this._materialId] as Material; }
    public set material(value) {
        this.materialId = value && value.id || ZeroGuid;
    }
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
        if (from.enabled !== undefined) {
            if (typeof from.enabled === 'number') {
                this.enabled = UserGroup.FromPacked(this.actor.context, from.enabled);
            } else {
                this.enabled = from.enabled;
            }
        }
        return this;
    }

    public toJSON() {
        return {
            enabled: this.enabled,
            materialId: this.materialId
        } as AppearanceLike;
    }
}
