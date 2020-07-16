
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import { Vector3Like } from '@microsoft/mixed-reality-extension-sdk';
import { App } from '../app';
import { User } from '@microsoft/mixed-reality-extension-sdk';

export default class PhysicsPileTest extends Test {

	public expectedResultDescription = "Piles should appear similar for each client";

	private testBounciness: number;
	private deleteBodiesTimout: number;
	private boxLimit: number;
	private boxCounter: number;

	private forceMagnitude: number;
	private addForceLikelyhood: number;

	private assets: MRE.AssetContainer;

	private b0: MRE.Actor;
	private b1: MRE.Actor;

	private redMat: MRE.Material;
	private redMatAddForce: MRE.Material;
	private blueMat: MRE.Material;
	private blueMatAddForce: MRE.Material;

	private interval0: NodeJS.Timeout;
	private interval1: NodeJS.Timeout;

	constructor(bounciness: number, deleteBodiesTimout: number, boxLimit: number, addForceLikelyhood: number,
		protected app: App, protected baseUrl: string, protected user: User) {
		super(app, baseUrl, user);
		this.testBounciness = bounciness;
		this.deleteBodiesTimout = deleteBodiesTimout;
		this.boxLimit = boxLimit;
		this.boxCounter = 0;
		this.forceMagnitude = 2000;
		this.addForceLikelyhood = addForceLikelyhood;
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.redMat = this.assets.createMaterial('redBox', {
			color: MRE.Color3.Red()
		});
		this.blueMat = this.assets.createMaterial('blueBox', {
			color: MRE.Color3.Blue()
		});

		this.redMatAddForce = this.assets.createMaterial('redBoxAddForce', {
			color: MRE.Color3.FromHexString('#664a72').toColor4()
		});

		this.blueMatAddForce = this.assets.createMaterial('blueBoxAddForce', {
			color: MRE.Color3.FromHexString('#c7518e').toColor4()
		});

		this.interval0 = setInterval(() => {
			if (this.app.context.users.length > 0) {
				const force = (1.0 - Math.random()) < this.addForceLikelyhood;
				const userId = this.app.context.users[0].id;
				this.createLabel(root, "RED", MRE.Color3.Red(), userId);
				this.spawnBox(root, -1.0, 1.5, ((force) ? this.redMatAddForce : this.redMat),
					userId, { x: (force ? this.forceMagnitude : 0), y: 0, z: 0 },
					0.15, this.deleteBodiesTimout);
			}
		}, 800);

		this.interval1 = setInterval(() => {
			if (this.app.context.users.length > 1) {
				const force = (1.0 - Math.random()) < this.addForceLikelyhood;
				const userId = this.app.context.users[1].id;
				this.createLabel(root, "BLUE", MRE.Color3.Blue(), userId);
				this.spawnBox(root, 1.0, 1.5, ((force) ? this.blueMatAddForce : this.blueMat),
					userId, { x: (force ? -this.forceMagnitude : 0), y: 0, z: 0 },
					0.15, this.deleteBodiesTimout);
			}
		}, 700);

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		clearInterval(this.interval0);
		clearInterval(this.interval1);
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

	private spawnBox(root: MRE.Actor, width: number, height: number, mat: MRE.Material, userId: MRE.Guid,
		force: Partial<Vector3Like>, radius = 0.15, killTimeout = 20000) {

		// only if there are not too many boxes already
		if (this.boxCounter < this.boxLimit) {

			const box = MRE.Actor.Create(this.app.context, {
				actor: {
					owner: userId,
					parentId: root.id,
					name: "box",
					grabbable: true,
					appearance: {
						meshId: this.assets.createBoxMesh('box', 1.3 * radius, 1.5 * radius, 1.8 * radius).id,
						materialId: mat.id
					},
					transform: {
						local: {
							position: {
								x: -width / 2 + width * Math.random(),
								y: height, z: -(0.4 + 0.8 * Math.random())
							}
						}
					},
					rigidBody: {
						mass: 3,
						angularVelocity: {
							x: 500 * Math.random() - 250.0, y: 500.0 * Math.random() - 250.0,
							z: 500 * Math.random() - 250.0
						},
						velocity: { x: 0.0, y: 0.0, z: 0.0 },
					},
					collider: { geometry: { shape: MRE.ColliderType.Auto }, bounciness: this.testBounciness }
				}
			});
			this.boxCounter = this.boxCounter + 1;

			setTimeout(() => {
				box.rigidBody.addForce(force)
			}, 1000);


			if (this.deleteBodiesTimout > 0) {
				setTimeout(() => {
					box.destroy();
				}, killTimeout);
			}
		}
	}
}
