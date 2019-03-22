/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { User } from '../..';

/**
 * @hidden
 */
export class InternalUser {
    // tslint:disable-next-line:variable-name
    public __rpc: any;

    constructor(public user: User) {
    }
}
