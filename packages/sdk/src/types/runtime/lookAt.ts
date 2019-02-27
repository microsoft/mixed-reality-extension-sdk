/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LookAtMode, Vector3, Vector3Like } from "../..";
import { ZeroGuid } from "../../constants";

export interface LookAtLike {
    actorId: string;
    mode: LookAtMode;
}

export class LookAt implements LookAtLike {
    // tslint:disable:variable-name
    private _actorId = ZeroGuid;
    private _mode = LookAtMode.None;
    // tslint:enable:variable-name

    public get actorId() { return this._actorId; }
    public set actorId(value) { value ? this._actorId = value : this._actorId = ZeroGuid; }
    public get mode() { return this._mode; }
    public set mode(value) { value ? this._mode = value : this._mode = LookAtMode.None; }

    /** @hidden */
    public toJSON(): LookAtLike {
        return {
            actorId: this.actorId,
            mode: this.mode
        } as LookAtLike;
    }

    public copy(from: Partial<LookAtLike>): this {
        if (!from) return this;
        if (from.actorId !== undefined) this._actorId = from.actorId;
        if (from.mode !== undefined) this._actorId = from.actorId;
        return this;
    }
}
