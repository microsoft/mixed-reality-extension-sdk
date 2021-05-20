/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Actor,
    BrowserCommand,
    SetBrowserStateOptions
} from '../..';
import { newGuid } from '../../util';

export class BrowserInstance {
    public actor: Actor;
    constructor(actor: Actor) {
        this.actor = actor;
    }

    public start(options: SetBrowserStateOptions): BrowserInstance {
        this.setStateInternal(BrowserCommand.Open, options);
        return this;

    }

    public setState(options: SetBrowserStateOptions): BrowserInstance {
        this.setStateInternal(BrowserCommand.Update, options);
        return this;
    }

    public navigate(url: string) {
        this.setState({url});
    }

    private setStateInternal(command: BrowserCommand, options: SetBrowserStateOptions) {
        if (!options.messageId) {
            options.messageId = newGuid();
        }

        this.actor.context.internal.setBrowserState(this, command, options);
    }
}

