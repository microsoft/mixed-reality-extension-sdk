/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import { Vector3, Color3 } from '@microsoft/mixed-reality-extension-sdk';

const options = {
	font: Object.keys(MRE.TextFontFamily) as MRE.TextFontFamily[],
};

// };
/**
 * Test the text api functionality
 */
export default class TextTest extends Test {
	public expectedResultDescription = "Text cycling their options";
	public interval: NodeJS.Timeout;
	private assets: MRE.AssetContainer;


	private textBlockName: MRE.Actor;
	private textActors: MRE.Actor[] = [];

	private textBlocks: any[] = [];
	private currentList = 0;
	
	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	public createDisplayString(x: any) {
		const unicodeChars: number[] = [];
		for(let i = x.blockStart; i < x.blockEnd; ++i){
			unicodeChars.push(i);
		}
		x.displayString = String.fromCharCode(...unicodeChars);
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.textBlocks.push(
			{blockStart: 0x20, blockEnd:0x07E, name:"Latin Basic"},
			{blockStart: 0xA0, blockEnd: 0xFF, name:"Latin Suppliment"},
			{blockStart: 0x100, blockEnd:0x017F, name:"Latin Extended - A"},
			{blockStart: 0x3060, blockEnd:0x309F, name:"Japanese Hiragana/Katakana"},
			{blockStart: 0x4E00, blockEnd:0x4F00, name:"Chinese/Japanese/Korean Ideographs"});		

		this.textBlocks.forEach((v,i,a) =>{ this.createDisplayString(v); });


		const position = new Vector3(0,1.2,0);
		for(const font of options.font) {
			const newActor = this.createTemplate(root, this.textBlocks[0].displayString);
			newActor.transform.local.position.copy(position);
			newActor.text.font = font;
			this.textActors.push( newActor );
			position.addInPlace(MRE.Vector3.Down().scale(.2))
		}

		this.textBlockName = MRE.Actor.Create(this.app.context, {
			actor:{
				name: "BlockName",
				parentId: root.id,
				transform: {
					local: {
						position: { x: 0, y: 1.5, z: 0 }
					}
				},
				text:{
					contents: this.textBlocks[0].name,
					height: .4,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: Color3.Teal()
				}
			}
		});

		// Start cycling the elements.
		this.interval = setInterval(() => this.cycleOptions(), 3000);

		await this.stoppedAsync();
		return true;
	}

	private cycleOptions(): void {
		this.currentList = (this.currentList + 1) % this.textBlocks.length;
		for(const text of this.textActors) {
			text.text.contents = this.textBlocks[this.currentList].displayString;
			this.textBlockName.text.contents = this.textBlocks[this.currentList].name;
		}
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
