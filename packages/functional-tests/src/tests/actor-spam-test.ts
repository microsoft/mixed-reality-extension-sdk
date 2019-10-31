/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class ActorSpamTest extends Test {
	public expectedResultDescription = "Spawn lots of actors all at once";
	private assets: MRE.AssetContainer;
	private spamRoot: MRE.Actor;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const buttonMesh = this.assets.createBoxMesh('button', .1, .1, .01);

		const twentyFive = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'twentyFiveButton',
				parentId: root.id,
				transform: { local: { position: { x: -1, y: 1.2, z: -1 } } },
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto} }
			}
		});
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: twentyFive.id,
				transform: { local: { position: { y: 0.06 } } },
				text: {
					contents: '25 actors',
					height: 0.1,
					anchor: MRE.TextAnchorLocation.BottomCenter
				}
			}
		});
		twentyFive.setBehavior(MRE.ButtonBehavior).onClick(() => this.spawnActors(root, 25));

		const fifty = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'fiftyButton',
				parentId: root.id,
				transform: { local: { position: { x: -0.33, y: 1.2, z: -1 } } },
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto} }
			}
		});
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: fifty.id,
				transform: { local: { position: { y: 0.06 } } },
				text: {
					contents: '50 actors',
					height: 0.1,
					anchor: MRE.TextAnchorLocation.BottomCenter
				}
			}
		});
		fifty.setBehavior(MRE.ButtonBehavior).onClick(() => this.spawnActors(root, 50));

		const hundred = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'hundredButton',
				parentId: root.id,
				transform: { local: { position: { x: 0.33, y: 1.2, z: -1 } } },
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto} }
			}
		});
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: hundred.id,
				transform: { local: { position: { y: 0.06 } } },
				text: {
					contents: '100 actors',
					height: 0.1,
					anchor: MRE.TextAnchorLocation.BottomCenter
				}
			}
		});
		hundred.setBehavior(MRE.ButtonBehavior).onClick(() => this.spawnActors(root, 100));

		const twoHundred = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'twoHundredButton',
				parentId: root.id,
				transform: { local: { position: { x: 1, y: 1.2, z: -1 } } },
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto} }
			}
		});
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: twoHundred.id,
				transform: { local: { position: { y: 0.06 } } },
				text: {
					contents: '200 actors',
					height: 0.1,
					anchor: MRE.TextAnchorLocation.BottomCenter
				}
			}
		});
		twoHundred.setBehavior(MRE.ButtonBehavior).onClick(() => this.spawnActors(root, 200));

		await this.stoppedAsync();
		return true;
	}

	private spawnActors(root: MRE.Actor, count: number) {
		if (this.spamRoot) {
			this.spamRoot.destroy();
		}

		const ball = this.assets.meshes.find(m => m.name === 'ball')
			|| this.assets.createSphereMesh('ball', 0.05);

		this.spamRoot = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'spamRoot',
				parentId: root.id,
				transform: { local: { position: { y: 1, z: -1 } } }
			}
		});

		const spacing = 2 / (25 - 1);
		for (let i = 0; i < count; i++) {
			MRE.Actor.Create(this.app.context, {
				actor: {
					name: 'ball',
					parentId: this.spamRoot.id,
					appearance: { meshId: ball.id },
					transform: {
						local: {
							position: {
								x: -1 + spacing * (i % 25),
								y: 0 - spacing * Math.floor(i / 25)
							}
						}
					}
				}
			});
		}
	}
}
