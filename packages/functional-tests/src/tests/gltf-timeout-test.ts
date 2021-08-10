/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GltfTimeoutTest extends Test {
	public expectedResultDescription = "Should fail after some timeout.";
	private assets: MRE.AssetContainer;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		try {
			await Promise.race([this.assets.loadGltf("/test/timeout/dummy.gltf"), this.stoppedAsync()]);
			console.log("Fake load succeeded?! Fail test");
			return false;
		} catch {
			console.log("Fake load failed, as designed.");
		}

		await this.stoppedAsync();
		return true;
	}
}
