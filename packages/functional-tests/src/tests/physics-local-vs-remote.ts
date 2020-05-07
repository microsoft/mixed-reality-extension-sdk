/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class PhysicsLocalVsRemoteTest extends Test {
	public expectedResultDescription = "Balls and boxes hit the ground and bounce.";
	private assets: MRE.AssetContainer;
	private interval: NodeJS.Timeout;

	private redMat: MRE.Material;
	private blueMat: MRE.Material;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.assets = new MRE.AssetContainer(this.app.context);

		this.redMat = this.assets.createMaterial('redBall', {
			color: MRE.Color3.Red()
		});
		this.blueMat = this.assets.createMaterial('blueBall', {
			color: MRE.Color3.Blue()
		});

		if (this.app.context.users.length > 0) {
			const userId = this.app.context.users[0].id;
			this.createLabel(root, "RED", MRE.Color3.Red(), userId);

			this.spawnBall(root, -1.0, 0.1, this.redMat, userId);

			this.spawnBall(root, 0.0, 0.1, this.redMat, userId);
			this.spawnBall(root, 0.0, 0.5, this.redMat, userId);
		}

		if (this.app.context.users.length > 1) {
			const userId = this.app.context.users[1].id;
			this.createLabel(root, "BLUE", MRE.Color3.Blue(), userId);

			this.spawnBall(root, +1.0, 0.1, this.blueMat, userId);

			this.spawnBall(root, 0.0, 0.3, this.blueMat, userId);
			this.spawnBall(root, 0.0, 0.7, this.blueMat, userId);
		}



		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	private createLabel(root: MRE.Actor, text: string, col: MRE.Color3, userId: MRE.Guid) {

		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: root.id,
				exclusiveToUser: userId,
				transform: { local: { position: { y: 1.5 } } },
				text: {
					contents: text,
					height: 0.1,
					anchor: MRE.TextAnchorLocation.TopCenter,
					color: col
				}
			}
		});
	}

	private spawnBall(root: MRE.Actor, width: number, height: number, mat: MRE.Material, userId: MRE.Guid,
		ballRadius = 0.07, killTimeout = 5000) {
		const ball = MRE.Actor.Create(this.app.context, {
			actor: {
				owner: userId,
				parentId: root.id,
				name: "box",
				grabbable: true,
				appearance: {
					meshId: this.assets.createBoxMesh('box', 0.2, 0.2, 0.2).id,
					materialId: mat.id
				},
				transform: {
					local: { position: { x: -width / 2 + width, y: height, z: -0.1 } }
				},
				rigidBody: {
					mass: 3,
				},
				collider: {
					geometry: { shape: MRE.ColliderType.Auto },
					bounciness: 0.0, dynamicFriction: 0.5, staticFriction: 0.5
				}
			}
		});
	}
}
