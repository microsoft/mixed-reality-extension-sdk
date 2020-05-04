
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import { App } from '../app';
import { User } from '@microsoft/mixed-reality-extension-sdk';

export default class PhysicsCollisionTest extends Test {

	public testBounciness: number;

	private assets: MRE.AssetContainer;

	private b0: MRE.Actor;
	private b1: MRE.Actor;

	private redMat: MRE.Material;
	private blueMat: MRE.Material;

	constructor(bounciness: number, protected app: App, protected baseUrl: string, protected user: User) {
		super(app, baseUrl, user);
	}

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
			this.spawnBall(root, -1.5, 0.2, this.redMat, userId, { x: 1000, y: 0, z: 0 });
		}

		if (this.app.context.users.length > 1) {
			const userId = this.app.context.users[1].id;
			this.createLabel(root, "BLUE", MRE.Color3.Blue(), userId);
			this.spawnBall(root, +1.0, 0.2, this.blueMat, userId, { x: 0, y: 0, z: 0 });
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
		force: Partial<MRE.Vector3Like>, ballRadius = 0.2, killTimeout = 5000) {
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
				collider: { geometry: { shape: MRE.ColliderType.Auto }, bounciness: 0.8 }
			}
		});

		setTimeout(() => {
			ball.rigidBody.addForce(force)
		}, 1000);

		setTimeout(() => {
			ball.destroy();
		}, killTimeout);
	}
}
