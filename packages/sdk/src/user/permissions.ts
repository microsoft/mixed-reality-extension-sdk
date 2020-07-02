/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The set of permissions MREs can request from users, and users can grant.
 */
export enum Permissions {
	/**
	 * Grants access to a persistent user identity across sessions. Needed for things like high scores lists or
	 * persistent settings. Allow: This user will be uniquely identified to this MRE origin across sessions and
	 * instances. Deny: This user will be assigned a new ID every time they connect to MREs from this origin.
	 * If the `user-interaction` permission is also denied, this client will not join a user to the session at all.
	 */
	UserTracking = 'user-tracking',
	/**
	 * Allow: This user can interact with behaviors, exclusively own actors, be a target for attached actors, and can be
	 * sent dialogs. Deny: Interactions with behaviors will not be sent back to the app server. Attempts to create
	 * exclusive actors for this user will fail. Actors attached to this user will be considered unattached. Calls
	 * to `user.prompt` will be rejected. If the `user-tracking` permission is also denied, this client will not join
	 * a user to the session at all.
	 */
	UserInteraction = 'user-interaction',
}
