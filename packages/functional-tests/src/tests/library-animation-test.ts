/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Test } from '../test';

export default class LibraryFailTest extends Test {
	public expectedResultDescription = "Plays an animation on click";

	private playingAnimation = false;
	public async run(): Promise<boolean> {
		const actor = MRE.Actor.CreateFromLibrary(this.app.context, {
			resourceId: 'Spinner_0',
			actor: {
				transform: {
					local: {
						position: { y: 1, z: -1 }
					}
				}
			}
		});
		actor.setBehavior(MRE.ButtonBehavior)
			.onClick(() => {
				this.playingAnimation = !this.playingAnimation;
				if (this.playingAnimation) {
					actor.enableAnimation('Spin');
				} else {
					actor.disableAnimation('Spin');
				}
			});

		await this.stoppedAsync();
		return true;
	}
}
