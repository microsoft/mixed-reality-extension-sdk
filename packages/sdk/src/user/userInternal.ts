/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DialogResponse, User, UserLike } from '../..';
import * as Payloads from '../network/payloads';
import { InternalPatchable } from '../patchable';
import { InternalContext } from './context';

/**
 * @hidden
 */
export class InternalUser implements InternalPatchable<UserLike> {
	public __rpc: any;
	public observing = true;
	public patch: UserLike;

	constructor(public user: User, public context: InternalContext) {
	}

	public getPatchAndReset(): UserLike {
		const patch = this.patch;
		if (patch) {
			patch.id = this.user.id;
			delete this.patch;
		}
		return patch;
	}

	public prompt(text: string, acceptInput: boolean): Promise<DialogResponse> {
		const payload = {
			type: 'show-dialog',
			userId: this.user.id,
			text,
			acceptInput
		} as Payloads.ShowDialog;

		return new Promise<Payloads.DialogResponse>((resolve, reject) => {
			this.context.sendPayload(payload, { resolve, reject });
		})
		.then(response => {
			if (response.failureMessage) {
				return Promise.reject(response.failureMessage);
			} else {
				return Promise.resolve({
					submitted: response.submitted,
					text: response.text
				} as DialogResponse);
			}
		});
	}
}
