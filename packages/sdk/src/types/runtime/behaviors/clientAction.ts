/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Context } from '..';
import { SetAudioStateOptions } from '../../..';
import * as Payloads from '../../network/payloads';

// tslint:disable: max-classes-per-file

export abstract class ClientAction {
	/** @hidden */
	public abstract toJSON(): any;

	/** @hidden */
	public sendPayload(context: Context, targetId: string, actionName: string, actionState: string) {
		context.internal.sendPayload({
			type: 'set-client-action',
			clientAction: {
				...this.toJSON(),
				targetId,
				actionName,
				actionState
			}
		} as Payloads.SetClientAction);
	}
}

export class PlayAnimationAction extends ClientAction {
	constructor(private animationName: string) {
		super();
	}

	/** @hidden */
	public toJSON() {
		return {
			type: 'play-animation',
			animationName: this.animationName
		};
	}
}

export class PlaySoundAction extends ClientAction {
	constructor(private soundAssetId: string, private options?: SetAudioStateOptions) {
		super();
	}

	/** @hidden */
	public toJSON() {
		return {
			type: 'play-sound',
			soundAssetId: this.soundAssetId,
			options: this.options
		};
	}
}
