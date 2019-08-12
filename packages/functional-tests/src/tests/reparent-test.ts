/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class ReparentTest extends Test {
	public expectedResultDescription = "Sphere should be jumping left, center, and right";
	private interval: NodeJS.Timeout;
	private assets: MRE.AssetContainer;

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		const leftParent = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { x: -0.7, y: 0.3, z: -0.3 }
					}
				}
			}
		});
		const rightParent = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { x: 0.7, y: 0.3, z: -0.3 }
					}
				}
			}
		});

		const sphere = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: leftParent.id,
				appearance: {
					meshId: this.assets.createSphereMesh('sphere', 0.25).id
				}
			}
		});

		let nextParent = 1;
		const parentIds = [leftParent.id, null, rightParent.id];
		this.interval = setInterval(() => {
			sphere.parentId = parentIds[nextParent];
			nextParent = (nextParent + 1) % parentIds.length;
		}, 1000);

		await this.stoppedAsync();
		return true;
	}
}
