/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import { Vector3 } from '@microsoft/mixed-reality-extension-sdk';
import { stringify } from 'querystring';
import { int } from '../../../sdk/node_modules/@microsoft/mixed-reality-extension-common/built/math/types';

const options = {
	font: Object.keys(MRE.TextFontFamily) as MRE.TextFontFamily[],
};

/**
 * Test the text api functionality
 */
export default class TextTest extends Test {
	public expectedResultDescription = "Text cycling their options";
	public interval: NodeJS.Timeout;
	private assets: MRE.AssetContainer;


	private texts: MRE.Actor[];

	private characterLists: string[];
	private currentList = 0;
	
	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const referenceMesh = this.assets.createSphereMesh('reference', 0.05);

		//Create Character lists
		let LatinBasic = 
		[" !\"#$%&\'()*+,-./,0123456789:;<=>?@ABCDEFGHIJKLMNO", 
		 "PQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"];

		let LatinBasic2 : string[] = ["",""];
		let i = " ".charCodeAt(0);
		for(; i < 'O'.charCodeAt(0); ++i){
			LatinBasic2[0] = LatinBasic2[0].concat(String.fromCharCode(i));
		}
		LatinBasic2[0] = LatinBasic2[0].concat("\n");
		for(; i < '~'.charCodeAt(0); ++i){
			LatinBasic2[1] = LatinBasic2[1].concat(String.fromCharCode(i));
		}

		this.characterLists = [];
		this.texts = [];

		for(let characters of LatinBasic)
		{
			this.characterLists.push(characters);
		}

		for(let characters of LatinBasic2)
		{
			this.characterLists.push(characters);
		}

		let position = new Vector3(-2,1.5,0);
		for(let font of options.font) {
			const newActor = this.createTemplate(root, this.characterLists[0]);
			newActor.transform.local.position.copy(position);
			this.texts.push( newActor );
			position.addInPlace(MRE.Vector3.Down().scale(.3))
		}


		// Start cycling the elements.
		this.interval = setInterval(() => this.cycleOptions(), 1000);

		await this.stoppedAsync();
		return true;
	}

	private cycleOptions(): void {
		this.currentList = (this.currentList + 1) % this.characterLists.length;
		for(let text of this.texts) {
			text.text.contents = this.characterLists[this.currentList];
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
					anchor: MRE.TextAnchorLocation.MiddleLeft
				},
			}
		});
	}
}
