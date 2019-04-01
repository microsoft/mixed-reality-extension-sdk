/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ScaledTransform, ScaledTransformLike, Transform, TransformLike } from "./transform";

export interface ActorTransformLike {
    app: Partial<TransformLike>;
    local: Partial<ScaledTransformLike>;
}

export class ActorTransform implements ActorTransformLike {
    // tslint:disable:variable-name
    private _app: Transform;
    private _local: ScaledTransform;
    // tslint:enable:variable-name

    public get app() { return this._app; }
    public set app(value) { this._app.copy(value); }
    public get local() { return this._local; }
    public set local(value) { this._local.copy(value); }

    constructor() {
        this._app = new Transform();
        this._local = new ScaledTransform();
    }

    public copy(from: Partial<ActorTransformLike>): this {
        if (!from) return this;
        if (from.app !== undefined) this.app.copy(from.app);
        if (from.local !== undefined) this.local.copy(from.local);
        return this;
    }

    public toJSON() {
        return {
            app: this.app.toJSON(),
            local: this.local.toJSON()
        } as ActorTransformLike;
    }
}
