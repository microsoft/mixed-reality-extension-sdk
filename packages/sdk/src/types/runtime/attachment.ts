/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { User } from '.';

export interface AttachmentLike {
    attachPoint: string;
    actorId: string;
}

export class Attachment {
    // tslint:disable:variable-name
    private _attachPoint: string;
    private _actorId: string;
    // tslint:enable:variable-name

    public get attachPoint() { return this._attachPoint; }
    public get actor() { return this.user.context.actor(this._actorId); }

    constructor(private user: User) { }
}
