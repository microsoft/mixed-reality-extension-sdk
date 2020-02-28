/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

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
		const layout = new MRE.PlanarGridLayout(root);

		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'platform',
				parentId: root.id,
				transform: { local: { position: { x: 2 } } },
				appearance: {
					meshId: this.assets.createBoxMesh('platformBox', 1, 0.1, 1).id
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto }, layer: MRE.CollisionLayer.Navigation }
			}
		});

		// loop over each collision layer value
		for (let i = 0; i < layers.length; i++) {
			// create column headers
			layout.addCell({
				row: 0,
				column: 1 + i,
				width: 0.5,
				height: 0.2,
				contents: MRE.Actor.Create(this.app.context, { actor: {
					name: `${layers[i]}ColLabel`,
					parentId: root.id,
					text: {
						contents: layers[i],
						height: 0.1,
						anchor: MRE.TextAnchorLocation.MiddleCenter,
						color: MRE.Color3.Teal()
					}
				}})
			});

			// create row headers
			layout.addCell({
				row: 1 + i,
				column: 0,
				width: 0.5,
				height: 0.2,
				contents: MRE.Actor.Create(this.app.context, { actor: {
					name: `${layers[i]}RowLabel`,
					parentId: root.id,
					text: {
						contents: layers[i],
						height: 0.1,
						anchor: MRE.TextAnchorLocation.MiddleCenter,
						color: MRE.Color3.Teal()
					}
				}})
			});

			// loop over each type of collider that could hit the first
			for (let j = 0; j < layers.length; j++) {
				let widgetRoot: MRE.Actor;
				layout.addCell({
					row: 1 + i,
					column: 1 + j,
					width: 0.5,
					height: 0.2,
					contents: widgetRoot = MRE.Actor.Create(this.app.context, { actor: {
						name: `${layers[i]}/${layers[j]}`,
						parentId: root.id
					}})
				});
				this.createWidget(widgetRoot, layers[i], layers[j]);
			}
		}
		layout.applyLayout();

		await this.stoppedAsync();
		return true;
	}

	private createWidget(root: MRE.Actor, layer1: MRE.CollisionLayer, layer2: MRE.CollisionLayer) {
		const ballMesh = this.assets.meshes.find(m => m.name === 'ball')
			|| this.assets.createSphereMesh('ball', 0.05);
		const boxMesh = this.assets.meshes.find(m => m.name === 'box')
			|| this.assets.createBoxMesh('box', 0.1, 0.1, 0.1);
		const ballMat = this.assets.materials.find(m => m.name === 'ball')
			|| this.assets.createMaterial('ball', { color: MRE.Color3.LightGray() });
		const boxDefaultMat = this.assets.materials.find(m => m.name === 'boxDefault')
			|| this.assets.createMaterial('boxDefault', { color: MRE.Color3.LightGray().toColor4(0.5) });
		const boxHitMat = this.assets.materials.find(m => m.name === 'boxHit')
			|| this.assets.createMaterial('boxHit', { color: MRE.Color3.Red().toColor4(0.5) });
		const ballAnim = this.assets.animationData.find(ad => ad.name === 'swing')
			|| this.assets.createAnimationData('swing', {
				tracks: [{
					target: MRE.ActorPath('target').transform.local.position.x,
					keyframes: [
						{ time: 0, value: 0.25 },
						{ time: 0.5, value: -0.25 },
						{ time: 1, value: 0.25 }]
				} as MRE.Track<number>]
			});

		const box = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'box',
				parentId: root.id,
				appearance: {
					meshId: boxMesh.id,
					materialId: boxDefaultMat.id
				},
				collider: {
					geometry: { shape: MRE.ColliderType.Auto },
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
					geometry: { shape: MRE.ColliderType.Auto },
					layer: layer2
				},
				rigidBody: {
					isKinematic: true
				}
			}
		});
		ballAnim.bind({ target: ball }, {
			weight: 1,
			wrapMode: MRE.AnimationWrapMode.Loop
		});
	}
}
