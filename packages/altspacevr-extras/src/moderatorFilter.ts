/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { UserEntryExitPoint, UserFilter, UserInteractionType } from './userFilter';

/**
 * A class that filters users by whether they are moderators in the AltspaceVR room.
 * @example Filter user joins and leaves by listening to this class's events instead of the main MRE context:
 * ```ts
 * const userFilter = new ModeratorFilter(context);
 * userFilter.onUserJoined(user => calledOnlyForModerators(user));
 * userFilter.onUserLeft(user => calledOnlyForModerators(user));
 * ```
 *
 * Can also be used to filter out input actions by moderator status:
 * ```ts
 * modControl.setBehavior(MRE.ButtonBehavior)
 * 	.onClick(userFilter.filterInput((user, evtData) => calledOnlyForModerators(user, evtData)));
 * ```
 *
 * Can be daisy-chained with other user filters:
 * ```ts
 * const filter = new ModeratorFilter(new SingleEventFilter(context));
 * ```
 */
export class ModeratorFilter extends UserFilter {
	private singleModeratorId: MRE.Guid;

	/**
	 *
	 * @param context An MRE.Context object, or another user filter instance
	 * @param allowOnlyOneModerator If true, only the first moderator to join the session passes the filter. Useful
	 * to prevent multi-room session attacks.
	 */
	constructor(context: UserEntryExitPoint, private allowOnlyOneModerator = false) {
		super(context);
	}

	protected shouldForwardUserEvent(user: MRE.User, eventType: UserInteractionType) {
		const userRoles = new Set(user.properties['altspacevr-roles'].split(','));
		if (this.allowOnlyOneModerator && !this.singleModeratorId && eventType === 'joined') {
			this.singleModeratorId = user.id;
		}

		return this.allowOnlyOneModerator && this.singleModeratorId === user.id ||
			!this.allowOnlyOneModerator && userRoles.has('moderator');
	}
}
