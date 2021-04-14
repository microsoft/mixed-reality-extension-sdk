/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Actor,
    BrowserCommand,
    SetBrowserStateOptions
} from '../..';

export class BrowserInstance {
    public actor: Actor;
    constructor(actor: Actor) {
        this.actor = actor;
    }
    public setState(options: SetBrowserStateOptions) {
        this.actor.context.internal.setBrowserState(this, BrowserCommand.Update, options);
    }

    public navigate(url: string) {
        this.setState({url});
    }
}

