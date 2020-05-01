/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class PhysicsBounceTest extends Test {
	public expectedResultDescription = "Balls and boxes hit the ground and bounce.";
	private assets: MRE.AssetContainer;
	private interval: NodeJS.Timeout;
	private materials: MRE.Material[] = [];
	private bouncePlane: MRE.Actor;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.materials.push(this.assets.createMaterial('mat1', { color: MRE.Color3.FromHexString('#ff0000').toColor4() }));
		this.materials.push(this.assets.createMaterial('mat2', { color: MRE.Color3.FromHexString('#ff7700').toColor4() }));
		this.materials.push(this.assets.createMaterial('mat3', { color: MRE.Color3.FromHexString('#ffbd00').toColor4() }));
		this.materials.push(this.assets.createMaterial('mat4', { color: MRE.Color3.FromHexString('#fcff00').toColor4() }));
		this.materials.push(this.assets.createMaterial('mat5', { color: MRE.Color3.FromHexString('#abf300').toColor4() }));

		this.createBouncePlane(root, 2, 1.25);

		this.interval = setInterval(() => this.spawnBallOrBox(root, 1.5, 1.5), 1000);

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	private createBouncePlane(root: MRE.Actor, width: number, height: number) {
		const box = this.assets.createBoxMesh('box', 2.0, 0.05, 2.0).id;
		this.bouncePlane = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				appearance: {
					meshId: box
				},
				transform: {
					app: { position: { x: 0.0, y: 0.0, z: -1.0 } }
				},
				collider: {
					geometry: { shape: MRE.ColliderType.Auto },
					bounciness: 0.8, dynamicFriction: 0.0, staticFriction: 0.0
				}
			}
		});
	}

	private spawnBallOrBox(root: MRE.Actor, width: number, height: number, radius = 0.1, killTimeout = 20000) {
		const isSphere = (Math.random() > 0.5);
		const ballOrBoxID = ((isSphere) ? (this.assets.createSphereMesh('ball', radius).id) :
			(this.assets.createBoxMesh('box', 1.5 * radius, 1.8 * radius, 2.1 * radius).id));
		// create ball or box
		const ballOrBox = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				appearance: {
					meshId: ballOrBoxID,
					materialId: this.materials[Math.floor(Math.random() * this.materials.length)].id
				},
				transform: {
					local: {
						position: {
							x: -width / 2 + width * Math.random(),
							y: height, z: -(-0.1 + 0.2 * Math.random())
						}
					}
				},
				rigidBody: {
					mass: 3,
					// give the box or spere some initial velocities
					angularVelocity: {
						x: 10 * Math.random() - 5.0, y: 10.0 * Math.random() - 5.0,
						z: 10 * Math.random() - 5.0
					},
					velocity: { x: 0.0, y: 5 * Math.random() - 2.5, z: -3.0 * Math.random() },
					constraints: [MRE.RigidBodyConstraints.None]
				},
				collider: {
					geometry: { shape: MRE.ColliderType.Auto },
					bounciness: 0.8, dynamicFriction: 0.0, staticFriction: 0.0
				}
			}
		});

		setTimeout(() => {
			ballOrBox.destroy();
		}, killTimeout);
	}
}
