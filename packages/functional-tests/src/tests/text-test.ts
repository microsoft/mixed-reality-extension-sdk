/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const options = {
    enabled: [true, false],
    contents: ["changing", "content"],
    ppl: [10, 20, 50],
    height: [.075, 0.15, 0.3],
    anchor: Object.keys(MRESDK.TextAnchorLocation) as MRESDK.TextAnchorLocation[],
    justify: Object.keys(MRESDK.TextJustify) as MRESDK.TextJustify[],
    font: Object.keys(MRESDK.TextFontFamily) as MRESDK.TextFontFamily[],
    color: [MRESDK.Color3.Red(), MRESDK.Color3.Green(), MRESDK.Color3.Blue(), MRESDK.Color3.White()]
};

/**
 * Test the text api functionality
 */
export default class TextTest extends Test {
    public expectedResultDescription = "Text cycling their options";
    public interval: NodeJS.Timeout;

    private enabled: MRESDK.Actor;
    private contents: MRESDK.Actor;
    private ppl: MRESDK.Actor;
    private height: MRESDK.Actor;
    private anchor: MRESDK.Actor;
    private justify: MRESDK.Actor;
    private font: MRESDK.Actor;
    private color: MRESDK.Actor;

    public async run(): Promise<boolean> {
        const enabled = this.createTemplate("enabled");
        this.enabled = enabled.value;
        this.enabled.transform.position.copy({ x: -1, y: 1.5, z: 0 });

        const contents = this.createTemplate('contents');
        this.contents = contents.value;
        this.contents.transform.position.copy({ x: 0, y: 1.5, z: 0 });

        const ppl = this.createTemplate('pixelsPerLine');
        this.ppl = ppl.value;
        this.ppl.transform.position.copy({ x: -1, y: 1, z: 0 });

        const height = this.createTemplate('height');
        this.height = height.value;
        this.height.transform.position.copy({ x: 0, y: 1, z: 0 });

        const font = this.createTemplate('font');
        this.font = font.value;
        this.font.transform.position.copy({ x: -1, y: 0.5, z: 0 });

        const color = this.createTemplate('color');
        this.color = color.value;
        this.color.transform.position.copy({ x: 0, y: 0.5, z: 0 });

        const anchor = this.createTemplate('anchor');
        this.anchor = anchor.value;
        this.anchor.transform.position.copy({ x: 1, y: 1.3, z: 0 });
        MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: .05
            },
            actor: {
                name: "anchorReference",
                parentId: this.anchor.id
            }
        });

        const justify = this.createTemplate('multiline\njustify');
        this.justify = justify.value;
        this.justify.transform.position.copy({ x: 1, y: 0.7, z: 0 });
        MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: .05
            },
            actor: {
                name: "justifyReference",
                parentId: this.justify.id
            }
        });

        // Start cycling the elements.
        this.interval = setInterval(() => this.cycleOptions(), 1000);

        await this.stoppedAsync();
        return true;
    }

    private cycleOptions(): void {
        this.enabled.text.enabled = options.enabled[
            (options.enabled.indexOf(this.enabled.text.enabled) + 1) % options.enabled.length
        ];

        this.contents.text.contents = options.contents[
            (options.contents.indexOf(this.contents.text.contents) + 1) % options.contents.length
        ];

        this.ppl.text.pixelsPerLine = options.ppl[
            (options.ppl.indexOf(this.ppl.text.pixelsPerLine) + 1) % options.ppl.length
        ];

        this.height.text.height = options.height[
            (options.height.indexOf(this.height.text.height) + 1) % options.height.length
        ];

        this.anchor.text.anchor = options.anchor[
            (options.anchor.indexOf(this.anchor.text.anchor) + 1) % options.anchor.length
        ];

        this.justify.text.justify = options.justify[
            (options.justify.indexOf(this.justify.text.justify) + 1) % options.justify.length
        ];

        this.font.text.font = options.font[
            (options.font.indexOf(this.font.text.font) + 1) % options.font.length
        ];

        this.color.text.color = options.color[
            (options.color.findIndex(c => c.equals(this.color.text.color)) + 1) % options.color.length
        ];
    }

    private createTemplate(text: string): MRESDK.ForwardPromise<MRESDK.Actor> {
        return MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: text.replace('\n', ' '),
                text: {
                    contents: text,
                    height: 0.15,
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter
                },
            }
        });
    }
}
