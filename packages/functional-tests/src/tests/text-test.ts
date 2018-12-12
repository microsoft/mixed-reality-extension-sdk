/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

// tslint:disable-next-line:variable-name
const Options = {
    enabled: [true, false],
    contents: ["changing", "content"],
    ppl: [10, 20, 50],
    height: [.1, .5, 1],
    anchor: Object.keys(MRESDK.TextAnchorLocation) as MRESDK.TextAnchorLocation[],
    justify: Object.keys(MRESDK.TextJustify) as MRESDK.TextJustify[],
    font: Object.keys(MRESDK.TextFontFamily) as MRESDK.TextFontFamily[],
    color: [MRESDK.Color3.Red(), MRESDK.Color3.Green(), MRESDK.Color3.Blue(), MRESDK.Color3.White()]
};

/**
 * Test the text api functionality
 */
export default class TextTest extends Test {

    private enabled: MRESDK.Actor;
    private contents: MRESDK.Actor;
    private ppl: MRESDK.Actor;
    private height: MRESDK.Actor;
    private anchor: MRESDK.Actor;
    private justify: MRESDK.Actor;
    private font: MRESDK.Actor;
    private color: MRESDK.Actor;

    constructor(app: App) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let actors: MRESDK.Actor[] = [];

        const enabled = this.createTemplate("enabled");
        this.enabled = enabled.value;
        this.enabled.transform.position.copy({ x: -3, y: 3, z: 0 });
        actors.push(this.enabled);

        const contents = this.createTemplate('contents');
        this.contents = contents.value;
        this.contents.transform.position.copy({ x: 3, y: 3, z: 0 });
        actors.push(this.contents);

        const ppl = this.createTemplate('pixelsPerLine');
        this.ppl = ppl.value;
        this.ppl.transform.position.copy({ x: -3, y: 2, z: 0 });
        actors.push(this.ppl);

        const height = this.createTemplate('height');
        this.height = height.value;
        this.height.transform.position.copy({ x: 3, y: 2, z: 0 });
        actors.push(this.height);

        const font = this.createTemplate('font');
        this.font = font.value;
        this.font.transform.position.copy({ x: -3, y: 1, z: 0 });
        actors.push(this.font);

        const color = this.createTemplate('color');
        this.color = color.value;
        this.color.transform.position.copy({ x: 3, y: 1, z: 0 });
        actors.push(this.color);

        const anchor = this.createTemplate('anchor');
        this.anchor = anchor.value;
        this.anchor.transform.position.copy({ x: -10, y: 1, z: 0 });
        actors.push(this.anchor);
        MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: .1
            },
            actor: {
                name: "anchorReference",
                parentId: this.anchor.id
            }
        });

        const justify = this.createTemplate('multiline\njustify');
        this.justify = justify.value;
        this.justify.transform.position.copy({ x: 10, y: 1, z: 0 });
        actors.push(this.justify);
        MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: .1
            },
            actor: {
                name: "justifyReference",
                parentId: this.justify.id
            }
        });

        // Start cycling the elements.
        const interval = setInterval(this.cycleOptions.bind(this), 1000);

        // Wait for some seconds.
        await delay(10000);

        // Stop cycling the elements.
        clearInterval(interval);

        // Destroy all the actors we created.
        actors = destroyActors(actors);

        return true;
    }

    private cycleOptions(): void {
        this.enabled.text.enabled = Options.enabled[
            (Options.enabled.indexOf(this.enabled.text.enabled) + 1) % Options.enabled.length
        ];

        this.contents.text.contents = Options.contents[
            (Options.contents.indexOf(this.contents.text.contents) + 1) % Options.contents.length
        ];

        this.ppl.text.pixelsPerLine = Options.ppl[
            (Options.ppl.indexOf(this.ppl.text.pixelsPerLine) + 1) % Options.ppl.length
        ];

        this.height.text.height = Options.height[
            (Options.height.indexOf(this.height.text.height) + 1) % Options.height.length
        ];

        this.anchor.text.anchor = Options.anchor[
            (Options.anchor.indexOf(this.anchor.text.anchor) + 1) % Options.anchor.length
        ];

        this.justify.text.justify = Options.justify[
            (Options.justify.indexOf(this.justify.text.justify) + 1) % Options.justify.length
        ];

        this.font.text.font = Options.font[
            (Options.font.indexOf(this.font.text.font) + 1) % Options.font.length
        ];

        this.color.text.color = Options.color[
            (Options.color.findIndex(c => c.equals(this.color.text.color)) + 1) % Options.color.length
        ];
    }

    private createTemplate(text: string): MRESDK.ForwardPromise<MRESDK.Actor> {
        return MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: text.replace('\n', ' '),
                text: {
                    contents: text,
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter
                }
            }
        });
    }
}
