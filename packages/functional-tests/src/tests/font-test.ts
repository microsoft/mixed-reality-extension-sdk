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
		[' ','!','\"','#','$','%','&','\'','(',')','*','+',',' ,'-','.','/',
		 '0','1','2' ,'3','4','5','6','7' ,'8','9',':',';','<' ,'=','>','?',
		 '@','A','B' ,'C','D','E','F','G' ,'H','I','J','K','L' ,'M','N','O',
		 'P','Q','R' ,'S','T','U','V','W' ,'X','Y','Z','[','\\',']','^','_',
		 '`','a','b' ,'c','d','e','f','g' ,'h','i','j','k','l' ,'m','n','o',
		 'p','q','r' ,'s','t','u','v','w' ,'x','y','z','{','|' ,'}','~','\t'];

		this.characterLists.push(LatinBasic.toString());

		let position : Vector3;
		position.set(-2,3,0);
		for(let font of options.font) {
			const newActor = this.createTemplate(root, this.characterLists[0]);5
			newActor.transform.local.position.copy(position);
			this.texts.push( newActor );
			position.add(MRE.Vector3.Down())
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
