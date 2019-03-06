/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class VisibilityTest extends Test {
    public expectedResultDescription = "Two rows of appearing cubes";
    private columns = [] as MRE.Actor[];
    private activeColumn = 0;
    private interval: NodeJS.Timeout;

    public async run(): Promise<boolean> {
        const root = MRE.Actor.CreateEmpty(this.app.context, {
            actor: { transform: { position: { x: 0.9 } } }
        }).value;
        let lastCol = root;
        for (let i = 0; i < 10; i++) {
            lastCol = this.createColumn(lastCol);
            this.columns.push(lastCol);
        }

        this.interval = setInterval(() => {
            const nextCol = (this.activeColumn + 1) % this.columns.length;
            this.columns[this.activeColumn].appearance.enabled = true;
            this.columns[nextCol].appearance.enabled = false;
            this.activeColumn = nextCol;
        }, 1000);

        await this.stoppedAsync();
        return true;
    }

    public cleanup() {
        clearInterval(this.interval);
    }

    private createColumn(parent: MRE.Actor, spacing = 0.15, boxSize = 0.1): MRE.Actor {
        const top = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: boxSize, y: boxSize, z: boxSize }
            },
            actor: {
                parentId: parent.id,
                transform: { position: { x: -spacing } }
            }
        }).value;

        MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: boxSize, y: boxSize, z: boxSize }
            },
            actor: {
                parentId: top.id,
                transform: { position: { y: -spacing } }
            }
        });

        return top;
    }
}
