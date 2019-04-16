/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import delay from '../utils/delay';

export default class UserExclusiveActorTest extends Test {
    public expectedResultDescription = "Your info, and nobody else's";
    public async run(): Promise<boolean> {
        await delay(1000);
        const connectedUserCount = Object.keys(this.app.connectedUsers).length;
        for (const user of this.app.context.users) {
            console.log(`generating actor for ${user.id}`);
            const labelText = 'User Name: ' + user.name +
                '\nUser ID: ' + user.id +
                "\nProperties: " + this.formatProperties(user.properties) +
                "\nTotal Connected Users:" + connectedUserCount;

            await MRE.Actor.CreateEmpty(this.app.context, {
                actor: {
                    exclusiveToUser: user.id,
                    transform: {
                        local: {
                            position: { x: 0, y: 1, z: 0 }
                        }
                    },
                    text: {
                        contents: labelText,
                        height: 0.1,
                        anchor: MRE.TextAnchorLocation.MiddleCenter
                    }
                }
            });
        }

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
