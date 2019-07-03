/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Test } from '../test';

export default class LibraryFailTest extends Test {
	public expectedResultDescription = "Fails";

	public async run(): Promise<boolean> {
		await MRE.Actor.CreateFromLibrary(this.app.context, { resourceId: 'artifact:abdc' });
		return true;
	}
}
