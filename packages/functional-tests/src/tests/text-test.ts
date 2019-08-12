/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const options = {
	enabled: [true, false],
	contents: ["changing", "content"],
	ppl: [10, 20, 50],
	height: [.075, 0.15, 0.3],
	anchor: Object.keys(MRE.TextAnchorLocation) as MRE.TextAnchorLocation[],
	justify: Object.keys(MRE.TextJustify) as MRE.TextJustify[],
	font: Object.keys(MRE.TextFontFamily) as MRE.TextFontFamily[],
	color: [MRE.Color3.Red(), MRE.Color3.Green(), MRE.Color3.Blue(), MRE.Color3.White()]
};

/**
 * Test the text api functionality
 */
export default class TextTest extends Test {
	public expectedResultDescription = "Text cycling their options";
	public interval: NodeJS.Timeout;
	private assets: MRE.AssetContainer;

	private enabled: MRE.Actor;
	private contents: MRE.Actor;
	private ppl: MRE.Actor;
	private height: MRE.Actor;
	private anchor: MRE.Actor;
	private justify: MRE.Actor;
	private font: MRE.Actor;
	private color: MRE.Actor;

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const referenceMesh = this.assets.createSphereMesh('reference', 0.05);

		this.enabled = this.createTemplate(root, "enabled");
		this.enabled.transform.local.position.copy({ x: -1, y: 1.5, z: 0 });

		this.contents = this.createTemplate(root, 'contents');
		this.contents.transform.local.position.copy({ x: 0, y: 1.5, z: 0 });

		this.ppl = this.createTemplate(root, 'pixelsPerLine');
		this.ppl.transform.local.position.copy({ x: -1, y: 1, z: 0 });

		this.height = this.createTemplate(root, 'height');
		this.height.transform.local.position.copy({ x: 0, y: 1, z: 0 });

		this.font = this.createTemplate(root, 'font');
		this.font.transform.local.position.copy({ x: -1, y: 0.5, z: 0 });

		this.color = this.createTemplate(root, 'color');
		this.color.transform.local.position.copy({ x: 0, y: 0.5, z: 0 });

		this.anchor = this.createTemplate(root, 'anchor');
		this.anchor.transform.local.position.copy({ x: 1, y: 1.3, z: 0 });
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: "anchorReference",
				parentId: this.anchor.id,
				appearance: { meshId: referenceMesh.id }
			}
		});

		this.justify = this.createTemplate(root, 'multiline\njustify');
		this.justify.transform.local.position.copy({ x: 1, y: 0.7, z: 0 });
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: "justifyReference",
				parentId: this.justify.id,
				appearance: { meshId: referenceMesh.id }
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

	private createTemplate(root: MRE.Actor, text: string): MRE.Actor {
		return MRE.Actor.Create(this.app.context, {
			actor: {
				name: text.replace('\n', ' '),
				parentId: root.id,
				text: {
					contents: text,
					height: 0.15,
					anchor: MRE.TextAnchorLocation.MiddleCenter
				},
			}
		});
	}
}
