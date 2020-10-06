/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class ButtonBehaviorTest extends Test {
	private defaultLabel = "Test the difference between click and hold";
	public expectedResultDescription = "Button behavior";

	private testButton: MRE.Actor;
	private testBehavior: MRE.ButtonBehavior;
	private buttonLabel: MRE.Actor;
	private assets: MRE.AssetContainer;
	private timer: NodeJS.Timeout;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.createEraseButton();

		// Create scene light
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

		await this.stoppedAsync();
		return true;
	}

	private displayString(string: string) {
		if(this.timer) {
			clearTimeout(this.timer);
		}
		this.buttonLabel.text.contents = string;
		this.timer = setTimeout(() => { this.buttonLabel.text.contents = this.defaultLabel; }, 1000);
	}

	private createEraseButton() {
		// Create erase button for the surface
		const buttonMesh = this.assets.createBoxMesh('eraseButton', .5, .5, .01);
		this.testButton = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'testButton',
				transform: { local: { position: { z: -.2, y: .7 } } },
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto } }
			}
		});

		this.buttonLabel = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'testLabel',
				parentId: this.testButton.id,
				transform: { local: { position: { y: .3 } } },
				text: {
					contents: this.defaultLabel,
					height: .1,
					anchor: MRE.TextAnchorLocation.BottomCenter,
					color: MRE.Color3.Teal()
				}
			}
		})

		const testButtonBehavior = this.testButton.setBehavior(MRE.ButtonBehavior);
		testButtonBehavior.onClick((_, __) => this.displayString("Click Detected!"));
		testButtonBehavior.onButton('holding', () => this.displayString("Hold Detected!"));
	}
}
