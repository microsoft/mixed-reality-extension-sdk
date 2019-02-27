/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class UserTest extends Test {
    public expectedResultDescription = "Lists user info";
    public async run(): Promise<boolean> {
        const connectedUserCount = Object.keys(this.app.connectedUsers).length;
        const labelText = 'Launched by User Named: ' + this.user.name +
            '\nUser ID: ' + this.user.id +
            "\nProperties: " + this.formatProperties(this.user.properties) +
            "\nTotal Connected Users:" + connectedUserCount;

        await MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 1, z: 0, w: 0 }
                },
                text: {
                    contents: labelText,
                    height: 0.1,
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter
                }
            }
        });

        await this.stoppedAsync();
        return true;
    }

    private formatProperties(props: { [key: string]: string }): string {
        let output = "";
        for (const k in props) {
            if (props.hasOwnProperty(k)) {
                output += `\n   ${k}: ${props[k]}`;
            }
        }
        return output;
    }
}
