/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, Material } from '.';
import { ZeroGuid } from '../../constants';

export interface AppearanceLike {
    enabled: boolean;
    materialId: string;
}

export class Appearance implements AppearanceLike {
    // tslint:disable:variable-name
    private _enabled = true;
    private _materialId = ZeroGuid;
    // tslint:enable:variable-name

    public get enabled(): boolean {
        return (!this.actor.parent || this.actor.parent.appearance.enabled) && this._enabled;
    }
    public set enabled(value) { this._enabled = value; }

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

    constructor(private actor: Actor, from: Partial<AppearanceLike> = null) {
        this.copy(from);
    }

    public copy(from: Partial<AppearanceLike>): this {
        if (!from) return this;
        if (from.enabled !== undefined) this.enabled = from.enabled;
        if (from.materialId !== undefined) this.materialId = from.materialId;
        return this;
    }

    public toJSON() {
        return {
            enabled: this.enabled,
            materialId: this.materialId
        } as AppearanceLike;
    }
}
