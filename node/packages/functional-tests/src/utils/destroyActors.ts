/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

export default function destroyActors(actors: MRESDK.Actor | MRESDK.Actor[]): MRESDK.Actor[] {
    if (!Array.isArray(actors)) {
        actors = [actors];
    }
    for (const actor of actors) {
        actor.destroy();
    }
    return [];
}
