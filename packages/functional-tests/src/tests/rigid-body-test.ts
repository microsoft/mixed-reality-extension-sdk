/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';

export default class RigidBodyTest extends Test {

	public async run(): Promise<boolean> {
		let success = true;

		success = success && await this.runSphereTest();
		success = success && await this.runStackedBoxTest();

		return success;
	}

	public async runSphereTest(): Promise<boolean> {
		const actors: Array<MRESDK.ForwardPromise<MRESDK.Actor>> = [];

		const sphereCount = 20;

		// Spawn a stack of spheres.
		for (let i = 0; i < sphereCount; ++i) {
			const actor = MRESDK.Actor.CreatePrimitive(this.app.context, {
				definition: {
					shape: MRESDK.PrimitiveShape.Sphere,
					radius: 0.25
				},
				addCollider: true,
				actor: {
					transform: {
						local: {
							position: {
								y: 1 + i * 0.51
							}
						}
					}
				}
			});
			actors.push(actor);
		}

		// Wait for all actors to instantiate on the host.
		await Promise.all(actors);

		// Wait for a short period.
		await delay(1000);

		// Add rigid bodies to the spheres.
		//   Do not use gravity.
		//   Add a small initial velocity.
		actors.forEach(actor =>
			actor.value.enableRigidBody({
				useGravity: false,
				velocity: {
					x: 2 * (Math.random() - 0.5),
					y: 2 * (Math.random() - 0.5),
					z: 2 * (Math.random() - 0.5),
				}
			})
		);

		// Wait for a short period.
		await delay(2000);

		// Enable gravity on the spheres.
		actors.forEach(actor => actor.value.rigidBody.useGravity = true);

		// Wait for a short period.
		await delay(4000);

		// Clean up.
		destroyActors(actors.map(actor => actor.value));

		return true;
	}

	public async runStackedBoxTest(): Promise<boolean> {
		let actors: Array<MRESDK.ForwardPromise<MRESDK.Actor>> = [];

		const size = 0.5;
		const spacing = 0.25;
		const initialCount = 11;
		let count = initialCount;
		let layer = 1;

		// Create a pyramid of boxes
		while (count > 0) {
			actors = [
				...actors,
				...this.createBoxLayer(
					count,
					-(initialCount / 2) * (size + spacing) + layer * (size + spacing) / 2,
					0.1 + size / 2 + (layer - 1) * size,
					size,
					spacing)];
			layer += 1;
			count -= 1;
		}

		// Wait for all the boxes to instantiate on the host.
		await Promise.all(actors);

		// Wait for a short period.
		await delay(500);

		// Add rigid bodies to boxes.
		actors.map(actor => actor.value).forEach(actor =>
			actor.enableRigidBody({
				useGravity: true,
			})
		);

		// Wait for a short period.
		await delay(2000);

		// Create a cannonball.
		const cannonball = MRESDK.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRESDK.PrimitiveShape.Sphere,
				radius: 0.5
			},
			addCollider: true,
			actor: {
				transform: {
					local: {
						position: {
							y: 1.25,
							z: -5
						}
					}
				}
			}
		});
		actors.push(cannonball);
		cannonball.value.enableRigidBody({
			useGravity: false,
			mass: 5,
		});

		// Wait for a short period.
		await delay(1000);

		// Shoot the cannonball at the pyramid.
		cannonball.value.rigidBody.addForce({ z: 10000 });    // tests rigid body update via command
		// cannonball.rigidBody.velocity.z = 20; // tests rigid body update via actor patch

		// Wait for a short period.
		await delay(5000);

		// Clean up.
		destroyActors(actors.map(actor => actor.value));

		return true;
	}

	public createBoxLayer(
		count: number,
		x: number,
		y: number,
		size: number,
		spacing: number
	): Array<MRESDK.ForwardPromise<MRESDK.Actor>> {
		const actors: Array<MRESDK.ForwardPromise<MRESDK.Actor>> = [];
		for (let i = 0; i < count; ++i) {
			const actor = MRESDK.Actor.CreatePrimitive(this.app.context, {
				definition: {
					shape: MRESDK.PrimitiveShape.Box,
					dimensions: {
						x: size,
						y: size,
						z: size
					},
				},
				addCollider: true,
				actor: {
					transform: {
						local: {
							position: {
								x: x + (size + spacing) * i,
								y
							}
						}
					}
				}
			});
			actors.push(actor);
		}
		return actors;
	}
}
