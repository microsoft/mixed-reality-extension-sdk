Permissions API
=================

To be a responsible member of the Social MR ecosystem, the MRE SDK has to prioritize the safety of its residents over
the power of this SDK. As such, I propose the addition of a permissions API, so MREs can have more "invasive" features
without compromising user safety and agency.


Features requiring user permission
------------------------------------

* `execution` (client only) - Required to connect to an MRE server. Typically granted by default, but can be revoked.
* User data - If neither permission is required or granted, no `user-join` message will be sent.
	* `user-tracking` - Grants access to a persistent user identity across sessions.
	* `user-interaction` - Behavior interaction, attachments, dialogs.
* Large assets - If an MRE wants to load more than some large amount of assets into memory (30MB worth of memory? TBD),
	the client must first approve. This permission might automatically be approved/denied by clients on behalf of users
	based on device capabilities.
* Movement (hypothetical) - The ability to forcibly move a user's avatar and point of view, either smoothly
	or teleported.
* Microphone input (hypothetical) - The ability for users to stream their microphone input into an MRE, for voice
	commands, synthesizers, chat bots, or anything else.

Permission declaration
------------------------

Apps must declare which APIs they will use in advance of any users connecting. This is done via a JSON-formatted
manifest loaded from the app's HTTP endpoint. The runtime should look for this manifest at
`http://<mre_url>/manifest.json`. Note that this file can be served from the filesystem or constructed on request.
The manifest must conform to the following JSON Schema:

```json
{
	"$schema": "http://json-schema.org/schema#",
	"type": "object",
	"properties": {
		"name": { "type": "string" },
		"author": { "type": "string" },
		"permissions": {
			"type": "array",
			"items": {
				"type": "string",
				"enum": ["user-tracking", "user-interaction"]
			}
		},
		"optionalPermissions": {
			"type": "array",
			"items": {
				"type": "string",
				"enum": ["user-tracking", "user-interaction"]
			}
		}
	}
}
```

Permissioning flow
--------------------

Legend:

* [App] Step executed by MRE developer code
* [SDK] Step executed by MRE SDK
* [Runtime] Step executed in client-side MRE runtime
* [Host] Step executed by host application

Startup:

1. [App] During development, the app developer authors a static manifest file, or uses the WebHost API to generate one.
2. [Host] Initializes the MRE API with a permissions manager instance that will receive new permissions requests.
2. [Host] The host wishes to run an MRE, so creates an IMixedRealityExtensionApp instance and calls Startup().
3. [Runtime] Downloads the manifest from the provided MRE server. If missing, assumes no permissions required.
4. []


Old stuff
===========


Methods for acquiring permission
----------------------------------

1. **Request permission for a feature the first time it is used**
	1. The application code makes an async call to an API that requires user permission.
	2. The SDK detects that this is the first time that API is used for this user, so it saves the API call request
		internally and sends a permission request to the user.
	3. The user's client will reply	with an approved or denied message. If approved, the original API call is executed.
		If not, handle the rejection.
2. **Request permission for a set of features explicitly**
	1. The application code uses a permissions API to set the permission requirements for the app.
	2. All current and late-joining users are sent a message asking for any permissions not already granted or denied.
	3. Each user will reply with an approved or denied message. If approved, the approval is saved, and all future API
		requests that require that permission will be processed for this user. If denied, handle the rejection.
3. **Establish permissions during initialization**
	1. Provide a list of permissions required by an app during app setup.
	2. During connection handshake, the list of required permissions will be sent to the client.
	3. If the client approves, initialization proceeds like normal. If not, handle the rejection.


Methods for handling permission rejection
-------------------------------------------

1. Revoke access to the denied APIs for the set of denying users.
2. All users must approve of all permissions; users that do not approve immediately leave the MRE.
3. All clients must approve of all permissions; clients that do not approve immediately disconnect from the MRE server.


Methods for presenting permission requests to users
-----------------------------------------------------

1. Dialogs
2. Settings menu
