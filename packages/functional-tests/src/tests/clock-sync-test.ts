/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class ClockSyncTest extends Test {
	public expectedResultDescription = "Digital clock face from animating text strips";
	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		const textScale = 0.15;
		const boxYPosition = 20;
		const boxHeight = 20 * textScale;
		const boxWidth = 10 * textScale;
		const boxGap = textScale * 0.6;
		const lineHeight = 1.20; // magic value based on default font

		// Make a root object.
		const tester = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { y: -1.5, z: -0.5 }
					}
				}
			}
		});

		const mesh = this.assets.createBoxMesh('box', boxWidth, boxHeight, 0.2);

		const topBox = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: tester.id,
				appearance: {
					meshId: mesh.id
				},
				transform: {
					local: {
						position: { x: 0.0, y: boxYPosition * textScale + (boxHeight / 2 + boxGap), z: 0.05 }
					}
				}
			}
		});
		const bottomBox = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: tester.id,
				appearance: {
					meshId: mesh.id
				},
				transform: {
					local: {
						position: { x: 0.0, y: boxYPosition * textScale - (boxHeight / 2 + boxGap), z: 0.05 }
					}
				}
			}
		});
		// Create the digits.
		const meshHundredths =
			this.createAnimatableDigit('hundredths', '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', tester.id);
		const meshTenths = this.createAnimatableDigit('tenths', '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', tester.id);
		const meshSeconds = this.createAnimatableDigit('seconds', '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', tester.id);
		const mesh10Seconds = this.createAnimatableDigit('10seconds', '0\n1\n2\n3\n4\n5\n0', tester.id);
		const meshMinutes = this.createAnimatableDigit('minutes', '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', tester.id);
		const mesh10Minutes = this.createAnimatableDigit('10minutes', '0\n1\n2\n3\n4\n5\n0', tester.id);
		const meshHours =
			this.createAnimatableDigit('hours',
				'0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n0', tester.id);
		const mesh10Hours = this.createAnimatableDigit('10hours', ' \n1\n2\n ', tester.id);

		// Make a handy array of all the digits.
		const actors = [
			meshHundredths, meshTenths, meshSeconds, mesh10Seconds, meshMinutes, mesh10Minutes, meshHours, mesh10Hours];

		// Build animations.
		const yOffset = boxYPosition + lineHeight * 0.5;
		this.buildDigitAnimation(meshHundredths, 4.25, yOffset, 1 / 100, 10, 10, lineHeight, textScale);
		this.buildDigitAnimation(meshTenths, 3.25, yOffset, 1 / 10, 10, 10, lineHeight, textScale);
		this.buildDigitAnimation(meshSeconds, 1.75, yOffset, 1, 10, 10, lineHeight, textScale);
		this.buildDigitAnimation(mesh10Seconds, 0.75, yOffset, 10, 6, 6, lineHeight, textScale);
		this.buildDigitAnimation(meshMinutes, -0.75, yOffset, 60, 10, 10, lineHeight, textScale);
		this.buildDigitAnimation(mesh10Minutes, -1.75, yOffset, 10 * 60, 6, 6, lineHeight, textScale);
		this.buildDigitAnimation(meshHours, -3.25, yOffset, 60 * 60, 24, 24, lineHeight, textScale);
		this.buildDigitAnimation(mesh10Hours, -4.25, yOffset, 10 * 60 * 60, 3, 2.4, lineHeight, textScale);

		// Start the animations.
		actors.forEach(actor => actor.enableAnimation('anim'));

		await this.stoppedAsync();

		// Stop the animations.
		actors.forEach(actor => actor.disableAnimation('anim'));

		return true;
	}

	public createAnimatableDigit(name: string, digits: string, parentId: string): MRE.Actor {
		return MRE.Actor.Create(this.app.context, {
			actor: {
				name,
				parentId,
				text: {
					contents: digits,
					anchor: MRE.TextAnchorLocation.TopCenter
				}
			}
		});
	}

	public buildDigitAnimation(
		mesh: MRE.Actor,
		xOffset: number,
		yOffset: number,
		secondsPerStep: number,
		digits: number,
		frameCount: number,
		lineHeight: number,
		scale: number) {

		const keyframes: MRE.AnimationKeyframe[] = [];

		// test: set to 0.01 to speed up 100x
		const timeScale = 1.0;

		const interpolationTimeSeconds = 0.1;

		// insert 2 keyframes per digit - start and (end-interpolationtime).
		// Special case is the very last digit,
		// which only inserts a start key, as the animation then snaps back to start at the rollover time
		for (let i = 0; i <= digits; ++i) {
			const value = {
				transform: {
					local: {
						position: {
							x: (xOffset) * scale,
							y: (yOffset + i * lineHeight) * scale,
							z: 0,
						},
						scale: { x: scale, y: scale, z: scale }
					}
				}
			};

			let frameNumber = i;
			if (i >= frameCount) {
				frameNumber = frameCount;
			}
			keyframes.push({
				time: timeScale * frameNumber * secondsPerStep,
				value
			});

			if (i < frameCount && secondsPerStep >= 1) {
				let frameNumber1 = i + 1;
				if (i + 1 >= frameCount) {
					frameNumber1 = frameCount;
				}
				keyframes.push({
					time: timeScale * (frameNumber1 * secondsPerStep - interpolationTimeSeconds),
					value
				});
			}
		}

		mesh.createAnimation(
			'anim', {
				wrapMode: MRE.AnimationWrapMode.Loop,
				keyframes
			});
	}
}
