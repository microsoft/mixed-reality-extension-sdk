/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { ModeratorFilter, SingleEventFilter } from '@microsoft/mixed-reality-extension-altspacevr-extras';
import { Test } from '../test';

export default class AltspaceVRUserFilterTest extends Test {
	public expectedResultDescription = "Only moderators can press the button";

	private assets: MRE.AssetContainer;
	private filter: MRE.UserFilter;
	private modList: MRE.Actor;
	private modButton: MRE.Actor;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		this.filter = new ModeratorFilter(new SingleEventFilter(this.app.context));

		this.modList = MRE.Actor.Create(this.app.context, { actor: {
			name: "moderatorList",
			parentId: root.id,
			transform: { local: {
				position: { x: -0.5, y: 1.6, z: -1 }
			}},
			text: {
				contents: "Moderators:\n" + this.filter.users.map(u => u.name).join('\n'),
				anchor: MRE.TextAnchorLocation.TopCenter,
				height: 0.1
			}
		}});

		this.filter.onUserJoined(() => this.updateModList());
		this.filter.onUserLeft(() => this.updateModList());

		const modMat = this.assets.createMaterial("buttonMat", {
			color: { r: 0.5, b: 0.5, g: 0.5, a: 1 }
		});

		this.modButton = MRE.Actor.Create(this.app.context, { actor: {
			name: "moderatorButton",
			parentId: root.id,
			transform: { local: {
				position: { x: 0.5, y: 1, z: -1 }
			}},
			appearance: {
				meshId: this.assets.createBoxMesh("moderatorButton", 0.2, 0.2, 0.01).id,
				materialId: modMat.id
			},
			collider: { geometry: { shape: MRE.ColliderType.Auto } }
		}});

		this.modButton.setBehavior(MRE.ButtonBehavior)
			.onButton('pressed', this.filter.filterInput(() => modMat.color.set(1, 1, 1, 1)))
			.onButton('released', this.filter.filterInput(() => modMat.color.set(0.5, 0.5, 0.5, 1)));

		await this.stoppedAsync();
		return true;
	}

	private updateModList() {
		this.modList.text.contents = "Moderators:\n" + this.filter.users.map(u => u.name).join('\n');
	}

	public unload() {
		this.assets.unload();
	}
}
