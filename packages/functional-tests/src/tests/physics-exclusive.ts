/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { App } from '../app';
import { Test } from '../test';
import { Vector3 } from '@microsoft/mixed-reality-extension-sdk';

export default class PhysicsExclusiveRigidBodyTest extends Test {

	public expectedResultDescription = "Exclusive should not impact shared rigid bodies";
	private assets: MRE.AssetContainer;
	private interval: NodeJS.Timeout;

	private sharedMaterial: MRE.Material;
	private exclusiveMaterial: MRE.Material;

	private fixUpMass: boolean;

	constructor(fixUpMass: boolean, protected app: App, protected user: MRE.User) {
		super(app, user);

		this.assets = new MRE.AssetContainer(this.app.context);

		this.fixUpMass = fixUpMass;

		this.sharedMaterial = this.assets.createMaterial('shared', { color: MRE.Color3.Blue()});
		this.exclusiveMaterial = this.assets.createMaterial('exclusive', { color: MRE.Color3.Magenta()});
	}

	public async run(root: MRE.Actor): Promise<boolean> {

		this.createLabels(root);

		const userId = this.app.context.users[1].id;

		const ownerId0 = this.app.context.users[0].id;
		const ownerId1 =this.app.context.users.length > 1 ?
			this.app.context.users[1].id : this.app.context.users[0].id;

		this.createCube(root, 0.5, new MRE.Vector3(-0.7, 0.25, -1.0), this.exclusiveMaterial, userId);
		this.createCube(root, 0.5, new MRE.Vector3( 0.0, 0.25, -1.0), this.exclusiveMaterial, userId);
		this.createCube(root, 0.5, new MRE.Vector3( 0.7, 0.25, -1.0), this.exclusiveMaterial, userId);

		this.createCube(root, 0.5, new MRE.Vector3(-0.7, 0.75, -1.0), this.exclusiveMaterial, userId);
		this.createCube(root, 0.5, new MRE.Vector3( 0.0, 0.75, -1.0), this.sharedMaterial, null, ownerId0);
		this.createCube(root, 0.5, new MRE.Vector3( 0.7, 0.75, -1.0), this.sharedMaterial, null, ownerId1);

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	private createLabels(root: MRE.Actor) {
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: root.id,
				transform: { local: { position: { x: -1.0, y: 3.5 } } },
				text: {
					contents: "shared",
					height: 0.5,
					anchor: MRE.TextAnchorLocation.TopCenter,
					color: this.sharedMaterial.color
				}
			}
		});

		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: root.id,
				transform: { local: { position: { x: 1.0, y: 3.5 } } },
				text: {
					contents: "exclusive",
					height: 0.5,
					anchor: MRE.TextAnchorLocation.TopCenter,
					color: this.exclusiveMaterial.color
				}
			}
		});
	}

	private createCube(root: MRE.Actor, size: number, position: Vector3, material: MRE.Material,
		user?: MRE.Guid, owner?: MRE.Guid) {
		return MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				name: "box",
				grabbable: true,
				exclusiveToUser: user,
				owner: owner,
				appearance: {
					meshId: this.assets.createBoxMesh('box', size, size, size).id,
					materialId: material.id
				},
				transform: {
					local: { position: position }
				},
				rigidBody: {
					mass: (this.fixUpMass && user !== null) ? 0.0001 : 1,
				},
				collider: {
					geometry: { shape: MRE.ColliderType.Auto },
					bounciness: 0.0, dynamicFriction: 0.5, staticFriction: 0.5
				}
			}
		});
	}
}
