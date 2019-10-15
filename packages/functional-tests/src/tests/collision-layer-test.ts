/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import { LeftRightSwing } from '../utils/animations';
import { TableLayout } from '../utils/tableLayout';

export default class CollisionLayerTest extends Test {
	public expectedResultDescription = "Observe different collision layer interactions";
	private assets: MRE.AssetContainer;

	public unload() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		root.transform.local.position.set(0, 1, -1);
		this.assets = new MRE.AssetContainer(this.app.context);

		const layers = Object.values(MRE.CollisionLayer);
		const tableLayout = new TableLayout(5, 5, 0.2, 0.5);

		// place column headers
		for (let i = 0; i < layers.length; i++) {
			tableLayout.setCellContents(0, 1 + i, MRE.Actor.Create(this.app.context, {
				actor: {
					name: `${layers[i]}ColLabel`,
					parentId: root.id,
					text: {
						contents: layers[i],
						height: 0.1,
						anchor: MRE.TextAnchorLocation.MiddleCenter
					}
				}
			}));
		}

		// loop over each collision layer value
		for (let i = 0; i < layers.length; i++) {
			// create label
			tableLayout.setCellContents(1 + i, 0, MRE.Actor.Create(this.app.context, {
				actor: {
					name: `${layers[i]}RowLabel`,
					parentId: root.id,
					text: {
						contents: layers[i],
						anchor: MRE.TextAnchorLocation.MiddleCenter,
						height: 0.1
					}
				}
			}));

			// loop over each type of collider that could hit the first
			for (let j = 0; j < layers.length; j++) {
				const widgetRoot = tableLayout.setCellContents(1 + i, 1 + j, MRE.Actor.Create(this.app.context, {
					actor: {
						name: `${layers[i]}/${layers[j]}`,
						parentId: root.id
					}
				}));
				this.createWidget(widgetRoot, layers[i], layers[j]);
			}
		}

		await this.stoppedAsync();
		return true;
	}

	private createWidget(root: MRE.Actor, layer1: MRE.CollisionLayer, layer2: MRE.CollisionLayer) {
		const ballMesh = this.assets.meshes[0]
			|| this.assets.createSphereMesh('ball', 0.05);
		const boxMesh = this.assets.meshes[1]
			|| this.assets.createBoxMesh('box', 0.1, 0.1, 0.1);
		const ballMat = this.assets.materials[0]
			|| this.assets.createMaterial('ball', { color: MRE.Color3.LightGray() });
		const boxDefaultMat = this.assets.materials[1]
			|| this.assets.createMaterial('boxDefault', { color: MRE.Color3.LightGray().toColor4(0.5) });
		const boxHitMat = this.assets.materials[2]
			|| this.assets.createMaterial('boxHit', { color: MRE.Color3.Red().toColor4(0.5) });

		const box = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'box',
				parentId: root.id,
				appearance: {
					meshId: boxMesh.id,
					materialId: boxDefaultMat.id
				},
				collider: {
					geometry: { shape: 'auto' },
					isTrigger: true,
					layer: layer1
				}
			}
		});
		box.collider.onTrigger('trigger-enter', () => {
			box.appearance.material = boxHitMat;
		});
		box.collider.onTrigger('trigger-exit', () => {
			box.appearance.material = boxDefaultMat;
		});

		const ball = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'ball',
				parentId: root.id,
				appearance: {
					meshId: ballMesh.id,
					materialId: ballMat.id
				},
				collider: {
					geometry: { shape: 'auto' },
					layer: layer2
				},
				rigidBody: {
					isKinematic: true
				}
			}
		});
		ball.createAnimation('swing', {
			keyframes: LeftRightSwing,
			wrapMode: MRE.AnimationWrapMode.Loop,
			initialState: {
				time: 0,
				enabled: true
			}
		});
	}
}
