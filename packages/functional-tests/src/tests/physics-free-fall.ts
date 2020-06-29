/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
export default class PhysicsFreeFallTest extends Test {

	private assets: MRE.AssetContainer;
	private redMat: MRE.Material;
	private blueMat: MRE.Material;

	public async run(root: MRE.Actor): Promise<boolean> {
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
			this.spawnBall(root, -0.5, 3.0, this.redMat, userId);
		}

		if (this.app.context.users.length > 1) {
			const userId = this.app.context.users[1].id;
			this.createLabel(root, "BLUE", MRE.Color3.Blue(), userId);
			this.spawnBall(root, +0.5, 3.0, this.blueMat, userId);
		}

		await this.stoppedAsync();
		return true;
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
				name: "ball",
				appearance: {
					meshId: this.assets.createSphereMesh('ball', ballRadius).id,
					materialId: mat.id
				},
				transform: {
					local: { position: { x: -width / 2 + width, y: height, z: -0.1 } }
				},
				rigidBody: {
					mass: 3,
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } }
			}
		});

		setTimeout(() => {
			// We need to disable rendering and move the ball before destroying it so that if it is currently
			// colliding with a peg, it will exit collision first for the ref counting to work properly.  Then
			// we can destroy it after another second to process the move on the client.
			ball.appearance.enabled = false;
			ball.transform.app.position = new MRE.Vector3(0, -10, 0);
			setTimeout(() => ball.destroy(), 1000);
		}, killTimeout);
	}
}
