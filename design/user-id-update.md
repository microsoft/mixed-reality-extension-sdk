## Make User IDs persistent for both registered and unregistered apps, and move make hashing logic into the runtime instead of letting host apps implement it

This is related to github issue #129.

I want us to redo user IDs and persistence. Current implementation is inconsistent across testbed+Altspace, is inconsistent across registered/unregistered apps, and was designed this way based off of us not having a permission system.

For Background for current implementation, see Issue #129:
1. Eric wrote: "In a space where an MRE is instantiated multiple times with the same sessionId, a given user in the world will have a different userId in each instance."
2. Steven wrote this comment : "@eanders-MS This is by design. GDPR requires us to not allow users to be tracked without their permission. As such, any given Altspace user will be assigned a different ID for each instance of a given app. I agree that a persistent ID per app would be tremendously useful, but we have to come up with a strategy to protect our users' privacy first."
3. Eric wrote about a design:
	"Registered apps: Same userId for a given user across multiple instances of an app (because the AppId is consistent).
	Unregistered apps: Different userIds for a given user across multiple instances of an app (because the AppId is derived from the space component id)."
	"We talked about adding functionality on the website for users to be able to be forgotten by all apps. How this would work: When generating the userId, include a key taken from the user record. When the user chooses to be forgotten, we would roll this key"

Currently in Altspace we use: UserID= combination of altspaceUserID and either appid (for registered apps) or SCID

Currently in testbed we use: UserID=Random generated every connection

### Proposed design
1. For all host apps have user runtime hash a persistent userID with an AppID or (if AppID isn't available) URL. 
2. Have the hashing logic be part of the unity runtime instead of be the host app's responsibility
3. Provide a workaround that allows multi-instance testing as a single user, by adding an optional postfix to the session ID, which gets hash with the User ID by the client
4. By having the hashing logic be in the unity runtime, this is also the natural home for the "me" permission to randomly generate the user ID instead.

(Note about AppID: Currently AppIDs are app specific (Altspace has its' own app registry), but issue #617 is tracking a request for a shared (host app-agnostic) MRE registry. 

### Benefits
1. users can reliably join same unregistered app in different spaces, and are recognized as the same user. Imagine a high score table or other save game data per user, if altspace space component is destroyed, this data is lost.
2. by allowing users to disable "me" permission (and connect with a randomized userID in that case), we still meet GDPR requirement.
3. user ID functionality is consistent across altspace and testbed
4. no behavior difference between registered and unregistered apps
5. right to be forgotten = that's on host app. For altspace, "delete your account" is an option. Host apps can also choose the rolling key.
6. easier to test "reconnect" in testbed

### Dealing with multiple instances joining the same session
Just to explain the reasoning by step 3 of the desing: There's one edge case in the current design, as we don't support multiple points of presence: connecting twice with the same user ID to the same session at the same time is not supported. This is super useful for testing, but not really a core case for regular use. A small workaround to sessionIDs could solve the cases that matter - adding a postfix onto the session ID, which is used only to hash the userID, but not used to connect to the server
Example: UserA has 2 instances of app ws://mreserver.com with sessionID 1234 and 1234#2. It would connect to the mre twice - once with SessionID 1234 and userID=(UserA hashed with ws://mreserver.com), and once with once with SessionID 1234 and userID=(UserA hashed with ws://mreserver.com#2)

### Required Changes
1. move userID, AppID, URL and SessionID hashing logic into the unity runtime, instead of in the host app
2. Remove session postfix from sessionID before connecting to the MRE.
3. Change hashing code to use altspaceUserID, AppID/URL, and SessionPostFix
4. (Later, in issue #617) if AppID is passed in without a URL, perform appid to url lookup from hostapp-agnostic MRE registry inside this code
5. Change testbed to persist a random-generated key for UserID


