# Behavior Actions

Behaviors are high level concepts that are made up of one or more actions.  These actions make up the interactions
that the user makes with the given behavior.  These actions are broken up in to three states: `started`, `performing` and `stopped`.

- `started` - The state of the initial frame that an action has started..
- `performing` - The state of all frames after `started` while the action is being performed.
- `stopped` - The state of the frame after the action has been stopped and all other frames after until started again.

These actions result in events being raised from the runtime to the SDK for app developers code to listen to.  These events are based 
off of the threee action states above as such:

- `started` - Fired once when the action has first transitioned to started.
- `performing` - Fired during synchronization updates while the action is being performed.  This is an optional event that is exposed only on behaviors that provide them.
- `stopped` - Fired once when the action has first transitioned to the stopped state.

**Proposed**: In addition, there is an optional update event that can be registered to the action for getting updates while that
action is being performed on the client.

## Architecture

### Action State
``` ts
export type ActionState
    = 'started'
    | 'performing'
	| 'stopped'
	;
```

### Action Handler
``` ts
/**
 * The action handler function type.
 */
export type ActionHandler = (user: User, actionData?: any) => void;
```

### Action API
``` ts 
/**
 * Add a handler for the given action state for when it is triggered.
 * @param actionState The action state that the handle should be assigned to.
 * @param handler The handler to call when the action state is triggered.
 */
public on(actionState: ActionState, handler: ActionHandler): this;

/**
 * Gets the current state of the action for the user with the given id.
 * @param user The user to get the action state for.
 * @returns The current state of the action for the user.
 */
public getState(user: User): ActionState;

/**
 * Get whether the action is active for the user with the given id.
 * @param user - The user to get whether the action is active for, or null
 * if active for any user is desired..
 * @returns - True if the action is active for the user, false if it is not.  In the case
 * that no user is given, the value is true if the action is active for any user, and false
 * if not.
 */
public isActive(user?: User): boolean

/**
 * Add a handler for the performing update call for this action.  Callback called on the
 * standard actor update cadence while an action is being performed, accompanied by optional
 * action data.
 * @param handler The handler to call when the performing action update comes in from the client.
 * **/
public onPerformingUpdate((handler: ActionHandler): this;
```

## Network

The `PerformAction` payload contains the type of state that the action is going through, as well as an
optional `actionData` object for the action being performed.  There is also a third category for the 
`PerformAction` payload that is `performingAction` which uses the payload to send up `actionData` if the 
behavior wished to convey this additional data for while the action is being performed.

### Perform Action Payload
``` ts
/**
 * @hidden
 * Engine to app. The user is performing an action for a behavior.
 */
export type PerformAction = Payload & {
	type: 'perform-action';
	userId: Guid;
	targetId: Guid;
	behaviorType: BehaviorType;
	actionName: string;
	actionState: ActionState & `performing`;
	actionData?: any;
};
```

## Client

The client will be respondible for sending `PerformAction` messages when an action is started or stopped, 
as well as performing updates on the standard actor update cadence.  Any date that the specific action should
pass along in the context of the behavior will be passed along in the optional action data object in the payload.