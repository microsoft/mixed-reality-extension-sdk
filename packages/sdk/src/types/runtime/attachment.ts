/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ZeroGuid } from "../../constants";

/**
 * The complete set of attach points.
 */
export type AttachPoint
    = 'none'
    | 'camera'
    | 'head'
    | 'neck'
    | 'spine'
    | 'hips'
    | 'foot'
    | 'toes'
    | 'left-eye'
    | 'left-upper-leg'
    | 'left-lower-leg'
    | 'left-shoulder'
    | 'left-upper-arm'
    | 'left-lower-arm'
    | 'left-hand'
    | 'left-thumb'
    | 'left-index'
    | 'left-middle'
    | 'left-ring'
    | 'left-pinky'
    | 'right-eye'
    | 'right-upper-leg'
    | 'right-lower-leg'
    | 'right-shoulder'
    | 'right-upper-arm'
    | 'right-lower-arm'
    | 'right-hand'
    | 'right-thumb'
    | 'right-index'
    | 'right-middle'
    | 'right-ring'
    | 'right-pinky'
    ;

/**
 * The characteristics of an active attachment.
 */
export interface AttachmentLike {
    userId: string;
    attachPoint: AttachPoint;
}

/**
 * Implementation of AttachmentLike. This class is observable.
 */
export class Attachment implements AttachmentLike {
    // tslint:disable:variable-name
    private _userId = ZeroGuid;
    private _attachPoint: AttachPoint = 'none';
    // tslint:enable:variable-name

    public get userId() { return this._userId; }
    public set userId(value) { this._userId = value || ZeroGuid; }
    public get attachPoint() { return this._attachPoint; }
    public set attachPoint(value) { this._attachPoint = value || 'none'; }

    /** @hidden */
    public toJSON(): AttachmentLike {
        return {
            userId: this.userId,
            attachPoint: this.attachPoint
        } as AttachmentLike;
    }

    public copy(from: Partial<AttachmentLike>): this {
        if (!from) return this;
        if (from.userId) this._userId = from.userId;
        if (from.attachPoint) this._attachPoint = from.attachPoint;
        return this;
    }
}
