/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const defaultBoxColor = MRE.Color3.FromInts(220, 150, 150);

export default class PhysicsFrictionTest extends Test {
	public expectedResultDescription = "Boxes slide with different frictions.";
	private assets: MRE.AssetContainer;
	private interval: NodeJS.Timeout;
	private boxMat: MRE.Material;
	private slopePlane: MRE.Actor;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.boxMat = this.assets.createMaterial('box', {
			color: defaultBoxColor
		});

		this.createSlopePlane(root, 2, 1.25);

		this.interval = setInterval(() => this.spawnBox(root, 1.5, 1.5), 500);

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	private createSlopePlane(root: MRE.Actor, width: number, height: number) {
		// Create a box as a slope for sliding 
		const box = this.assets.createBoxMesh('box', 2.5, 0.05, 2.5).id;
		this.slopePlane = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				appearance: {
					meshId: box,
					materialId: this.boxMat.id
				},
				transform: {
					app: { position: { x: 0.0, y: 0.5, z: -0.8 },
						rotation: {x: 0.966, y: 0.0, z: 0.0, w: 0.259} } // 30 degree around Y
				},
				text: {
					contents: `Boxes with different frictions`,
					anchor: MRE.TextAnchorLocation.MiddleLeft,
					height: .2
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto }, 
					bounciness: 0.0, dynamicFriction: 0.1, staticFriction: 0.1 }
			}
		});
	}

	private spawnBox(root: MRE.Actor, width: number, height: number, radius = 0.1, killTimeout = 5000) {
		const boxId = this.assets.createBoxMesh('box', 1.5*radius, 1.8*radius, 2.1*radius).id;
		// boxes for the slope and with the same dynamic and static friction
		const friction = 0.7*Math.random();
		const box = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				appearance: {
					meshId: boxId,
					materialId: this.boxMat.id
				},
				transform: {
					local: { position: { x: -width / 2 + width * Math.random(), 
						y: height, z: -(-0.1 + 0.2*Math.random()) } }
				},
				rigidBody: {
					mass: 3,
					angularVelocity: { x: 50*Math.random() - 25.0, y: 50.0*Math.random()-25.0, 
						z: 50*Math.random()-25.0},
					velocity: {x: 0.0, y: 0.0, z: 0.0},
					constraints: [MRE.RigidBodyConstraints.None]
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto }, 
					bounciness: 0.0, dynamicFriction: friction, staticFriction: friction }
			}
		});

		setTimeout(() => {
			box.destroy();
		}, killTimeout);
	}
}
