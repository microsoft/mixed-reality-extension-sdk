/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class UserMaskTest extends Test {
	public expectedResultDescription = "Click to change teams";
	private assets: MRE.AssetContainer;
	private redList: MRE.Actor;
	private blueList: MRE.Actor;
	private interval: NodeJS.Timeout;

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		// create colors
		this.assets = new MRE.AssetContainer(this.app.context);
		const blue = this.assets.createMaterial('blueMat', {
			color: { r: .102, g: 0.169, b: 0.843 }
		});
		const red = this.assets.createMaterial('redMat', {
			color: { r: .854, g: 0.132, b: 0.132 }
		});

		// create team labels
		const textDef = {
			justify: MRE.TextJustify.Center,
			anchor: MRE.TextAnchorLocation.TopCenter,
			height: 0.08
		} as MRE.TextLike;
		this.redList = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'redList',
				parentId: root.id,
				transform: { app: { position: { x: -1, y: 1.5 } } },
				appearance: { enabled: true },
				text: textDef
			}
		});
		this.blueList = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'blueList',
				parentId: root.id,
				transform: { app: { position: { x: 1, y: 1.5 } } },
				appearance: { enabled: true },
				text: textDef
			}
		});
		this.updateLabels();
		this.app.context.onUserLeft(_ => this.updateLabels());

		// create icons
		const redIcon = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'redIcon',
				parentId: root.id,
				appearance: {
					enabled: new MRE.GroupMask(this.app.context, ['red', 'default']),
					meshId: this.assets.createBoxMesh('box', 0.5, 0.5, 0.5).id,
					materialId: red.id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					app: { position: { y: 1 } }
				}
			}
		});

		const blueIcon = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'blueIcon',
				parentId: root.id,
				appearance: {
					enabled: new MRE.GroupMask(this.app.context, ['blue', 'default']),
					meshId: this.assets.createSphereMesh('sphere', 0.3).id,
					materialId: blue.id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					app: { position: { y: 1 } }
				}
			}
		});

		// blink the icons for unaffiliated users
		this.interval = setInterval(() => {
			if (redIcon.appearance.enabledFor.has('default')) {
				redIcon.appearance.enabledFor.delete('default');
				blueIcon.appearance.enabledFor.delete('default');
			} else {
				redIcon.appearance.enabledFor.add('default');
				blueIcon.appearance.enabledFor.add('default');
			}
		}, 750);

		// switch team on icon click
		redIcon.setBehavior(MRE.ButtonBehavior).onButton('pressed',
			user => this.switchTeams(user));
		blueIcon.setBehavior(MRE.ButtonBehavior).onButton('pressed',
			user => this.switchTeams(user));

		await this.stoppedAsync();
		return true;
	}

	private switchTeams(user: MRE.User) {
		if (user.groups.has('red')) {
			user.groups.delete('red');
			user.groups.add('blue');
		} else if (user.groups.has('blue')) {
			user.groups.delete('blue');
			user.groups.add('red');
		} else {
			user.groups.add(Math.random() >= 0.5 ? 'blue' : 'red');
		}

		this.updateLabels();
	}

	private updateLabels(): void {
		const redList: string[] = [];
		const blueList: string[] = [];
		for (const user of this.app.context.users) {
			if (user.groups.has('red')) {
				redList.push(user.name);
			} else if (user.groups.has('blue')) {
				blueList.push(user.name);
			}
		}

		this.redList.text.contents = `Red team:\n${redList.join('\n')}`;
		this.blueList.text.contents = `Blue team:\n${blueList.join('\n')}`;
	}
}
