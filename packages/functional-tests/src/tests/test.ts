/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import App from '../app';

export default abstract class Test {

    constructor(protected app: App) {
    }

    public abstract run(): Promise<boolean>;
    public cleanup() {
    }
}
