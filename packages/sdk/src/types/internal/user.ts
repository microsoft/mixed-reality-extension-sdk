/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { User, UserLike } from '../..';
import { InternalPatchable } from '../patchable';

/**
 * @hidden
 */
export class InternalUser implements InternalPatchable<UserLike> {
    // tslint:disable-next-line:variable-name
    public __rpc: any;
    public observing = true;
    public patch: UserLike;

    constructor(public user: User) {
    }

    public getPatchAndReset(): UserLike {
        const patch = this.patch;
        if (patch) {
            patch.id = this.user.id;
            delete this.patch;
        }
        return patch;
    }
}
