/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The set of permissions MREs can request from users, and users can grant.
 */
export enum Permissions {
	/** No permissions */
	None = 0,
	/**
	 * Required to connect to an MRE server. Typically granted by default, but can be revoked. Automatically requested
	 * by MREs, and can be assumed granted by any user that successfully joins. Allow: MRE connection can be
	 * established. Deny: MRE connection will not be established.
	 */
	Execution = 1,
	/**
	 * Grants access to a persistent user identity across sessions. Needed for things like high scores lists or
	 * persistent settings. Allow: This user will be uniquely identified to this MRE origin across sessions and
	 * instances. Deny: This user will be assigned a new ID every time they connect to MREs from this origin.
	 * If the `user-interaction` permission is also denied, this client will not join a user to the session at all.
	 */
	UserTracking = 2,
	/**
	 * Allow: This user can interact with behaviors, exclusively own actors, be a target for attached actors, and can be
	 * sent dialogs. Deny: Interactions with behaviors will not be sent back to the app server. Attempts to create
	 * exclusive actors for this user will fail. Actors attached to this user will be considered unattached. Calls
	 * to `user.prompt` will be rejected. If the `user-tracking` permission is also denied, this client will not join
	 * a user to the session at all.
	 */
	UserInteraction = 4
};
