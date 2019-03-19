/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class UserMaskTest extends Test {
    public expectedResultDescription = "Red team or blue team";
    private redList: MRE.Actor;
    private blueList: MRE.Actor;

    public async run(): Promise<boolean> {
        // create colors
        const blue = this.app.context.assetManager.createMaterial('blueMat', {
            color: { r: .102, g: 0.169, b: 0.843 }
        }).value;
        const red = this.app.context.assetManager.createMaterial('redMat', {
            color: { r: .854, g: 0.132, b: 0.132 }
        }).value;

        // create team labels
        const textDef = {
            justify: MRE.TextJustify.Center,
            anchor: MRE.TextAnchorLocation.TopCenter,
            height: 0.08
        } as MRE.TextLike;
        this.redList = MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: 'redList',
                transform: { position: { x: -1, y: 1.5 } },
                text: textDef
            }
        }).value;
        this.blueList = MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: 'blueList',
                transform: { position: { x: 1, y: 1.5 } },
                text: textDef
            }
        }).value;
        this.updateLabels();

        // create icons
        const redIcon = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 0.5, y: 0.5, z: 0.5 }
            },
            addCollider: true,
            actor: {
                name: 'redIcon',
                appearance: {
                    enabled: new MRE.UserGroupCollection(['red', 'default']),
                    materialId: red.id
                },
                transform: {
                    position: { y: 1 }
                }
            }
        }).value;

        const blueIcon = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: 0.3
            },
            addCollider: true,
            actor: {
                name: 'blueIcon',
                appearance: {
                    enabled: new MRE.UserGroupCollection(['blue', 'default']),
                    materialId: blue.id
                },
                transform: {
                    position: { y: 1 }
                }
            }
        }).value;

        // switch team on icon click
        redIcon.setBehavior(MRE.ButtonBehavior).onClick('pressed',
            id => this.switchTeams(this.app.context.user(id)));
        blueIcon.setBehavior(MRE.ButtonBehavior).onClick('pressed',
            id => this.switchTeams(this.app.context.user(id)));

        await this.stoppedAsync();
        return true;
    }

    private switchTeams(user: MRE.User) {
        if (user.groups.has('red')) {
            user.groups.delete('red');
            user.groups.add('blue');
        } else if (user.groups.has('blue')) {
            user.groups.delete('blue');
            user.groups.add('red');
        } else {
            user.groups.add(Math.random() >= 0.5 ? 'blue' : 'red');
        }

        this.updateLabels();
    }

    private updateLabels(): void {
        const redList: string[] = [];
        const blueList: string[] = [];
        for (const user of this.app.context.users) {
            if (user.groups.has('red')) {
                redList.push(user.name);
            } else if (user.groups.has('blue')) {
                blueList.push(user.name);
            }
        }

        this.redList.text.contents = `Red team:\n${redList.join('\n')}`;
        this.blueList.text.contents = `Blue team:\n${blueList.join('\n')}`;
    }
}
