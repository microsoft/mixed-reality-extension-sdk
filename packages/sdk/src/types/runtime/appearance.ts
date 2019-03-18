/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, Material } from '.';
import UserGroup from '../userGroup';
import { ZeroGuid } from '../../constants';

export interface AppearanceLike {
    enabled: boolean | number;
    materialId: string;
}

export class Appearance implements AppearanceLike {
    /** @hidden */
    public $DoNotObserve = ['activeAndEnabled', 'actor', 'material'];

    // tslint:disable:variable-name
    private _materialId = ZeroGuid;
    // tslint:enable:variable-name

    /**
     * This actor's visibility preference, independent of its parent. See
     * [[activeAndEnabled]] for the actual visibility state.
     */
    public enabled = true;

    /** Whether this actor is visible */
    public get activeAndEnabled() {
        return (!this.actor.parent || this.actor.parent.appearance.enabled) && this.enabled;
    }

    /**
     * Display this actor only for members of the contained groups.
     */
    public readonly enabledFor = new UserGroup();

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
        if (!from) {
            return this;
        }
        if (from.enabled !== undefined) {
            if (typeof from.enabled === 'number') {
                this.enabled = true;
                this.enabledFor.clear();
                this.enabledFor.addPacked(from.enabled);
            } else {
                this.enabled = from.enabled;
                this.enabledFor.clear();
            }
        }
        if (from.materialId !== undefined) {
            this.materialId = from.materialId;
        }
        return this;
    }

    public toJSON() {
        return {
            enabled: this.enabled && this.enabledFor.size > 0 ? this.enabledFor.packed() : this.enabled,
            materialId: this.materialId
        } as AppearanceLike;
    }
}
