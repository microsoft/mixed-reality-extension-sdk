/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class LookAtTest extends Test {

    constructor(app: App, private baseUrl: string, private user: MRESDK.User) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runLookAtTest();

        return success;
    }

    public async runLookAtTest(): Promise<boolean> {
        const tester = await MRESDK.Actor.CreateFromGLTF(this.app.context, {
            resourceUrl: `${this.baseUrl}/monkey.glb`
        });
        await tester.createAnimation(
            'circle', {
                wrapMode: MRESDK.AnimationWrapMode.Loop,
                keyframes: [
                    {
                        time: 0, value: {
                            transform: {
                                position: { x: 0, y: 0, z: 0 }
                            }
                        }
                    },
                    {
                        time: 1, value: {
                            transform: {
                                position: { x: 2, y: 2, z: 0 }
                            }
                        }
                    },
                    {
                        time: 2, value: {
                            transform: {
                                position: { x: 0, y: 4, z: 0 }
                            }
                        }
                    },
                    {
                        time: 3, value: {
                            transform: {
                                position: { x: -2, y: 2, z: 0 }
                            }
                        }
                    },
                    {
                        time: 4, value: {
                            transform: {
                                position: { x: 0, y: 0, z: 0 }
                            }
                        }
                    },
                ]
            });

        tester.enableAnimation('circle');

        this.app.rpc.send('functional-test:trace-message', 'look-at-test', "LookAtMode.None");
        tester.lookAt(null, MRESDK.LookAtMode.None);
        await delay(2000);

        this.app.rpc.send('functional-test:trace-message', 'look-at-test', "LookAtMode.TargetXY");
        tester.lookAt(this.user, MRESDK.LookAtMode.TargetXY);
        await delay(4000);

        this.app.rpc.send('functional-test:trace-message', 'look-at-test', "LookAtMode.TargetY");
        tester.lookAt(this.user, MRESDK.LookAtMode.TargetY);
        await delay(4000);

        this.app.rpc.send('functional-test:trace-message', 'look-at-test', "LookAtMode.None");
        tester.lookAt(null, MRESDK.LookAtMode.None);
        await delay(1000);

        tester.disableAnimation('circle');
        destroyActors(tester);

        return true;
    }
}
