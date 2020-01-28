/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const defaultPegColor = MRE.Color3.FromInts(79, 36, 6);
const defaultBallColor = MRE.Color3.FromInts(220, 150, 150);
const collisionPegColor = MRE.Color3.FromInts(0, 252, 75);

export default class PhysicsSimTest extends Test {
	public expectedResultDescription = "Balls trickle through the plinko board.\nClick to disable a peg.";
	private assets: MRE.AssetContainer;
	private interval: NodeJS.Timeout;
	private defaultPegMat: MRE.Material;
	private collisionPegMat: MRE.Material;
	private disabledPegMat: MRE.Material;
	private ballMat: MRE.Material;
	private collRefCount = new Map<MRE.Guid, number>();
	private ballCount = 0;
	private counterPlane: MRE.Actor;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		this.defaultPegMat = this.assets.createMaterial('defaultPeg', {
			color: defaultPegColor
		});
		this.collisionPegMat = this.assets.createMaterial('collisionPeg', {
			color: collisionPegColor
		});
		this.disabledPegMat = this.assets.createMaterial('disabledPeg', {
			color: new MRE.Color4(0.8, 0, 0, 0.5)
		});
		this.ballMat = this.assets.createMaterial('ball', {
			color: defaultBallColor
		});

		this.createCounterPlane(root, 2, 1.25);

		this.createPegField(root, 2, 1);
		this.interval = setInterval(() => this.spawnBall(root, 1.5, 1.5), 1000);

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	private createCounterPlane(root: MRE.Actor, width: number, height: number) {
		// Create the ball count text objects
		this.counterPlane = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				transform: {
					app: { position: { x: -width / 2, y: height + 0.2, z: 0.01 } }
				},
				text: {
					contents: `Ball count: ${this.ballCount}`,
					anchor: MRE.TextAnchorLocation.MiddleLeft,
					height: .2
				}
			}
		});

		// Create the trigger plane for the ball counter.
		const counter = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				transform: {
					local: { position: { x: 0, y: height, z: 0 } }
				},
				collider: {
					geometry: {
						shape: MRE.ColliderType.Box,
						size: { x: width, y: 0.01, z: 2 }
					},
					isTrigger: true
				}
			}
		});

		counter.collider.onTrigger('trigger-enter', () => {
			++this.ballCount;
			this.counterPlane.text.contents = `Ball count: ${this.ballCount}`;
		});
	}

	private createPegField(
		root: MRE.Actor,
		width: number, height: number,
		pegRadius = 0.02, spacing = 0.2, verticalDistort = 1.1
	) {

		const finalPosition = new MRE.Vector3(width / 2, height, -0.07);
		const position = new MRE.Vector3(-width / 2, 0.25, -0.07);
		let oddRow = 0;

		const pegMesh = this.assets.createCylinderMesh('peg', 0.2, pegRadius, 'z');

		while (position.x <= finalPosition.x && position.y <= finalPosition.y) {
			const peg = MRE.Actor.Create(this.app.context, {
				actor: {
					parentId: root.id,
					transform: { local: { position } },
					appearance: {
						meshId: pegMesh.id,
						materialId: this.defaultPegMat.id
					},
					collider: { geometry: { shape: MRE.ColliderType.Auto } }
				}
			});
			peg.collider.onCollision('collision-enter', () => {
				this.collRefCount.set(peg.id, (this.collRefCount.get(peg.id) ?? 0) + 1);
				if (this.collRefCount.get(peg.id) > 0) {
					peg.appearance.material = this.collisionPegMat;
				}
			});

			peg.collider.onCollision('collision-exit', () => {
				this.collRefCount.set(peg.id, this.collRefCount.get(peg.id) - 1);
				if (this.collRefCount.get(peg.id) === 0) {
					peg.appearance.material = this.defaultPegMat;
				}
			});

			peg.setBehavior(MRE.ButtonBehavior).onClick(() => {
				peg.collider.enabled = false;
				peg.appearance.material = this.disabledPegMat;
			});

			position.x += spacing;
			if (position.x > finalPosition.x) {
				position.y += verticalDistort * spacing;
				oddRow = 1 - oddRow;

				position.x = -width / 2 + oddRow * spacing / 2;
			}
		}
	}

	private spawnBall(root: MRE.Actor, width: number, height: number, ballRadius = 0.07, killTimeout = 5000) {
		const ball = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				appearance: {
					meshId: this.assets.createSphereMesh('ball', ballRadius).id,
					materialId: this.ballMat.id
				},
				transform: {
					local: { position: { x: -width / 2 + width * Math.random(), y: height, z: -0.1 } }
				},
				rigidBody: {
					mass: 3,
					constraints: [MRE.RigidBodyConstraints.FreezePositionZ]
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
