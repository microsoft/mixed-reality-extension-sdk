/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GridTest extends Test {
	public expectedResultDescription = "Click balls to realign grid";
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
		const buttonGrid = new MRE.PlanarGridLayout(anchor);
		for (let i = 0; i < 9; i++) {
			const alignment = Object.values(MRE.BoxAlignment)[i];
			const button = MRE.Actor.Create(this.app.context, { actor: {
				name: alignment + "-button",
				parentId: anchor.id,
				appearance: { meshId: ball.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto } }
			}});
			button.setBehavior(MRE.ButtonBehavior).onClick(() => {
				buttonGrid.gridAlignment = alignment;
				buttonGrid.applyLayout(0.5);
			});
			buttonGrid.addCell({
				row: Math.floor(i / 3),
				column: i % 3,
				width: 0.3,
				height: 0.3,
				contents: button
			});

			const label = MRE.Actor.Create(this.app.context, { actor: {
				name: "label",
				parentId: anchor.id,
				transform: { local: { position: { z: -0.16 } } },
				text: {
					contents: GridTest.ShortName(alignment),
					height: 0.05,
					anchor: GridTest.BoxToTextAlignment(alignment),
					color: MRE.Color3.Teal()
				}
			}});
			buttonGrid.addCell({
				row: Math.floor(i / 3),
				column: i % 3,
				width: 0.3,
				height: 0.3,
				alignment,
				contents: label
			});
		}
		buttonGrid.applyLayout();

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		this.assets.unload();
	}

	private static ShortName(align: MRE.BoxAlignment) {
		return align.charAt(0) + /-(.)/u.exec(align)[1];
	}

	private static BoxToTextAlignment(boxAlign: MRE.BoxAlignment) {
		switch (boxAlign) {
			case MRE.BoxAlignment.TopLeft: return MRE.TextAnchorLocation.BottomRight;
			case MRE.BoxAlignment.TopCenter: return MRE.TextAnchorLocation.BottomCenter;
			case MRE.BoxAlignment.TopRight: return MRE.TextAnchorLocation.BottomLeft;
			case MRE.BoxAlignment.MiddleLeft: return MRE.TextAnchorLocation.MiddleRight;
			case MRE.BoxAlignment.MiddleCenter: return MRE.TextAnchorLocation.MiddleCenter;
			case MRE.BoxAlignment.MiddleRight: return MRE.TextAnchorLocation.MiddleLeft;
			case MRE.BoxAlignment.BottomLeft: return MRE.TextAnchorLocation.TopRight;
			case MRE.BoxAlignment.BottomCenter: return MRE.TextAnchorLocation.TopCenter;
			case MRE.BoxAlignment.BottomRight: return MRE.TextAnchorLocation.TopLeft;
		}
	}
}
