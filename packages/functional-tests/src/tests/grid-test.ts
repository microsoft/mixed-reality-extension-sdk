/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GridTest extends Test {
	public expectedResultDescription = "Lay out actors in a grid";
	private assets: MRE.AssetContainer;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const box = this.assets.createBoxMesh('box', 0.24, 0.24, 0.24);
		const ball = this.assets.createSphereMesh('ball', 0.15);

		const anchor = MRE.Actor.Create(this.app.context, { actor: {
			name: "anchor",
			parentId: root.id,
			transform: { local: { position: new MRE.Vector3(0, 1, -1)}},
			appearance: { meshId: box.id }
		}});

		// create button grid
		const buttonGrid = new MRE.GridLayout(anchor);
		for (let i = 0; i < 9; i++) {
			const alignment = Object.values(MRE.BoxAlignment)[i];
			const button = MRE.Actor.Create(this.app.context, { actor: {
				name: alignment + "-button",
				parentId: anchor.id,
				appearance: { meshId: ball.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto } }
			}});
			button.setBehavior(MRE.ButtonBehavior).onClick(() => {
				console.log(alignment);
				buttonGrid.gridAlignment = alignment;
				buttonGrid.applyLayout();
			});
			buttonGrid.addCell({
				row: Math.floor(i / 3), column: i % 3,
				width: 0.3, height: 0.3,
				contents: button
			});
		}
		buttonGrid.applyLayout();

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		this.assets.unload();
	}
}
