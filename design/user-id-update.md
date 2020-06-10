## Make User IDs persistent across session ID, but unique per AppID

This is related to github issue #129.

I want us to redo user IDs and persistence. Current implementation is inconsistent across testbed+Altspace, is inconsistent across registered/unregistered apps, and was designed this way based off of us not having a permission system.

For Background for current implementation, see Issue #129:
1. Eric wrote: "In a space where an MRE is instantiated multiple times with the same sessionId, a given user in the world will have a different userId in each instance."
2. Steven wrote this comment : "@eanders-MS This is by design. GDPR requires us to not allow users to be tracked without their permission. As such, any given Altspace user will be assigned a different ID for each instance of a given app. I agree that a persistent ID per app would be tremendously useful, but we have to come up with a strategy to protect our users' privacy first."
3. Eric wrote about a design:
	"Registered apps: Same userId for a given user across multiple instances of an app (because the AppId is consistent).
	Unregistered apps: Different userIds for a given user across multiple instances of an app (because the AppId is derived from the space component id)."
	"We talked about adding functionality on the website for users to be able to be forgotten by all apps. How this would work: When generating the userId, include a key taken from the user record. When the user chooses to be forgotten, we would roll this key"

Currently in Altspace we use: UserID= combination of altspaceUserID, sessionID, and SCID

Currently in testbed we use: UserID=Random generated every connection

### Proposed design
Just have user runtime hash userID with an AppID, not with sessionID/SCID/anything else. And have the hashing logic be part of the unity runtime instead of be the host app's responsibility

(Note about AppID: AppID for now is URL, but in the future AppID should be either URL or actual AppID registered in the hostapp-agnostic MRE registry - see issue #617)

### Benefits
1. users can reliably join same session ID in different spaces. Imagine a high score table or other save game data per user, if altspace space component is destroyed, this data is lost.
2. by not hashing with session ID, it's possible for people to have multiple different sessions, and have them share data on the backend.
3. by allowing users to disable "me" permission (and connect with a randomized userID in that case), we still meet GDPR requirement.
4. user ID functionality is consistent across altspace and testbed
5. no behavior difference between registered and unregistered apps
6. right to be forgotten = that's on host app. For altspace, "delete your account" is an option. Host apps can also choose the rolling key.
7. easier to test "reconnect" in testbed

### Dealing with multiple instances with same session ID
There's one edge case in this: connecting twice with the same user ID to the same sessionID at the same time. Super useful for testing, but not really a core case for regular use. A small workaround to sessionIDs could solve the cases that matter - adding a postfix onto the session ID, which is used only to hash the userID, but not used to connect to the server
Example: UserA has 2 instances of app ws://mreserver.com with sessionID 1234 and 1234#2. It would connect to the mre twice - once with SessionID 1234 and userID=(UserA hashed with ws://mreserver.com), and once with once with SessionID 1234 and userID=(UserA hashed with ws://mreserver.com#2)

### Required Changes
1. move userID, AppID and SessionID hashing logic into the unity runtime, instead of in the host app
2. Remove session postfix from sessionID before connecting.
3. Change hashing code to use altspaceUserID, AppID, SessionPostFix
4. (Eventually) perform appid to url lookup from app registry
5. Change testbed to persist a random-generated key for UserID


