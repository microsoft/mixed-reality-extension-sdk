User Filtering
================

It is rare that an in-market MRE will allow all users to take all actions, and it typically falls to the developer to
filter out the users that they don't want. This operation is so common though, that adding some of this boilerplate
to the core SDK seems reasonable. To this end, I propose the following mechanisms:


interface UserEntryExitPoint
------------------------------

This is an interface for only the user management parts of `MRE.Context`: `onUserJoined`, `offUserJoined`, `onUserLeft`,
and `offUserLeft`. This interface can then be applied to new classes that surface users to developers in a different
way than Context does. One such class is `UserFilter`.


class UserFilter
------------------

This is an abstract base class for any time you want to disregard a group of users entirely from some operation. It
takes as constructor input a `UserEntryExitPoint` instance, and is itself a `UserEntryExitPoint`, meaning that these
filters can be daisy-chained.

Core to the concept of a filter is the actual requirement predicate. `UserFilter` has an abstract method called
`shouldForwardUserEvent`, which takes as input a user object, and what type of event it is filtering: a user join
or an interaction event (user-left is always tied to user-joined). It returns a boolean indicating whether the user
passes the filter.

Operationally, user filters listen for user joined/left events from the provided entry/exit point, filter those users
by the built-in predicate, and fire their own user join/left events for users that pass. They can also filter behavior
actions via a `filterInput` instance method, which wraps an `ActionHandler`, and only calls the handler if the
triggering user passes the filter.


AltspaceVR filters: moderator role and event IDs
--------------------------------------------------

In AltspaceVR, users are frequently sorted by whether they have moderator privileges in the room with the MRE. This
is exposed to MREs by a user property named `altspacevr-roles`, which is a comma-separated list of AltspaceVR
contextual roles, one of which is `moderator`. A new `ModeratorFilter` class in the `altspacevr-extras` NPM package
filters users by whether they are moderators, or if a flag is passed, whether they are the *first* moderator to join
the MRE session.

Because AltspaceVR roles are context-dependent, confusing states can arise if multiple AltspaceVR contexts
(events or spaces) are connected to the same MRE session. To avoid this, a `SingleEventFilter` class, also in
`altspacevr-extras`, will filter out users that are not in the same context as the first user to connect to the
session.


Examples
----------

Filter user joins and leaves by listening to this class's events instead of the main MRE context:

```js
const filter = new ModeratorFilter(context);
filter.onUserJoined(user => calledOnlyForModerators(user));
filter.onUserLeft(user => calledOnlyForModerators(user));
```

Can be used to filter out input actions by moderator status:

```js
modControl.setBehavior(MRE.ButtonBehavior)
.onClick(filter.filterInput((user, evtData) => calledOnlyForModerators(user, evtData)));
```

Can be daisy-chained with other user filters:

```js
const filter = new ModeratorFilter(new SingleEventFilter(context));
```
