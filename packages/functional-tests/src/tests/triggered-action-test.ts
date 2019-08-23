/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class TriggeredActionTest extends Test {
	public expectedResultDescription = "Hover to enable walk animation";

	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		const model = MRE.Actor.CreateFromGltf(this.app.context, {
			resourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models' +
				'/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
			colliderType: 'box',
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { x: 0, z: -1 }
					}
				}
			}
		});

		model.setBehavior(MRE.ButtonBehavior)
			.onHover('enter', {
				triggeredAction: {
					type: 'play-animation',
					animationName: 'animation:0'
				}
			})
			.onHover('exit', {
				triggeredAction: {
					type: 'stop-animation',
					animationName: 'animation:0'
				}
			});

		await this.stoppedAsync();
		return true;
	}
}
