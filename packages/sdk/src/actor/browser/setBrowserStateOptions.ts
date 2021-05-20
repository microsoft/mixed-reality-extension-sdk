/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Guid } from "../../util";

/**
 * Parameters to the `Actor.navigate` call
 */
export type SetNavigationStateOptions = {
    messageId?: Guid;
    /**
     * The browser should navigate to this url
     */
    url?: string;
}

/** Parameters to the `BrowserInstance.setState` call */
export type SetBrowserStateOptions = SetNavigationStateOptions;
