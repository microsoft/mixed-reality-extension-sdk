/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class InterpolationTest extends Test {
	public expectedResultDescription = "Lerping scale and rotation";
	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		MRE.Actor.Create(this.app.context, {
			actor: {
				name: "Light",
				parentId: root.id,
				light: {
					type: 'point',
					range: 5,
					intensity: 2,
					color: { r: 1, g: 0.5, b: 0.3 }
				},
				transform: {
					local: {
						position: { x: -2, y: 2, z: -2 }
					}
				}
			}
		});

		const cube = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				appearance: {
					meshId: this.assets.createBoxMesh('box', 0.65, 0.65, 0.65).id
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: { y: 1.0, z: -1.0 }
					}
				}
			}
		});

		while (!this.stopped) {
			// Random point on unit sphere (pick random axis).
			const θ = Math.random() * 2 * Math.PI;
			const z = Math.cos(θ);
			const x = Math.sqrt(1 - z * z) * Math.cos(θ);
			const y = Math.sqrt(1 - z * z) * Math.sin(θ);
			const axis = new MRE.Vector3(x, y, z);
			// Random rotation around picked axis.
			const rotation = MRE.Quaternion.RotationAxis(axis, Math.random() * 2 * Math.PI);
			// Random scale in [0.3..1.0].
			const scalar = 0.3 + 0.7 * Math.random();
			const scale = new MRE.Vector3(scalar, scalar, scalar);
			// Random ease curve.
			const easeCurveKeys = Object.keys(MRE.AnimationEaseCurves);
			const easeIndex = Math.floor(Math.random() * easeCurveKeys.length);
			const easeCurveKey = easeCurveKeys[easeIndex];
			// Interpolate object's rotation and scale.
			await MRE.Animation.AnimateTo(this.app.context, cube, {
				destination: { transform: { local: { rotation, scale } } },
				duration: 1.0,
				easing: MRE.AnimationEaseCurves[easeCurveKey]
			});
		}

		return true;
	}
}
