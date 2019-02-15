/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from '../test';

export default class UserTest extends Test {

    private _user: MRESDK.User;
    constructor(app: App, private baseUrl: string, private user: MRESDK.User) {
        super(app);
        this._user = user;
    }

    public async run(): Promise<boolean> {
        const connectedUserCount = Object.keys(this.app.connectedUsers).length;
        const labelText = 'Launched by User Named: ' + this._user.name +
                '\nUser ID: ' + this._user.id +
                "\nIP Address: " + this._user.properties.remoteAddress +
                "\nTotal Connected Users:" + connectedUserCount;

        const label = await MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                text: {
                    contents: labelText,
                    height: 0.3,
                    anchor: MRESDK.TextAnchorLocation.BottomCenter
                }
            }
        });
        await delay(3 * 1000);

        destroyActors([label]);
        return true;
    }
}
