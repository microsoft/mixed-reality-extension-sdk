#  Tool Behavior

The tool behavior allows the user to assign this behavior to an actor so that the actor can be held and
used.

## Architecture

Create a new behavior that is an `ToolBehavior` for being able to add to an actor, that when added will
automatically enable grabbable on that actor.  This behavior will then allow the user to execute a primary 
action to begin recording the transform changes over time.

``` ts
/**
 * Tool behavior class containing the target behavior actions.
 */
export class ToolBehavior extends TargetBehavior {
	private _holding: DiscreteAction = new DiscreteAction();
	private _using: DiscreteAction = new DiscreteAction();

	/** @inheritdoc */
	public get behaviorType(): BehaviorType { return 'tool'; }

	public get holding() { return this._holding; }
	public get using() { return this._using; }

	/**
	 * Add a holding handler to be called when the given hover state is triggered.
	 * @param holdingState The holding state to fire the handler on.
	 * @param handler The handler to call when the holding state is triggered.
	 * @return This tool behavior.
	 */
	public onHolding(holdingState: 'grabbed' | 'dropped', handler: ActionHandler): this {
		const actionState: ActionState = (holdingState === 'grabbed') ? 'started' : 'stopped';
		this._holding.on(actionState, handler);
		return this;
	}

	/**
	 * Add a using handler to be called when the given hover state is triggered.
	 * @param usingState The using state to fire the handler on.
	 * @param handler The handler to call when the using state is triggered.
	 * @return This tool behavior.
	 */
	public onUsing(usingState: 'started' | 'stopped', handler: ActionHandler): this {
		const actionState: ActionState = (hoverState === 'started') ? 'started' : 'stopped';
		this._using.on(actionState, handler);
		return this;
	}
}
```

## Network

The network messages will use the behavior payloads of SetBehavior and PerformAction payloads the same way all
behaviors do.  In addition, there is an additional message that would come in the form of the path of the tool
while it is being used.  This will be sent with a higher fidelity than the normal 10 hz transform updates, and 
will be in the form of a collection of transform recordings.

The message payload for the using path updates could look like the following:

``` ts
export type UsingToolPath = Payload & {
	type: 'using-tool-path';
	actorId: toolActorId;
	path: Transform[];
}
```

## Sync layer considerations

Synchronization will follow the same procedure as all other behaviors.  Nothing special about this behavior.
The additional sync concerns will center around the path data being sent to the MRE app from the tool behavior
when it is being used.  This path data only needs to be sent to the MRE app and not the other clients, as the
MRE app will be responsible for doing what it wants with the path, or behavior that extends `ToolBehavior` may 
have its own work it does with this path.

## Client implementation

Client implementation is similar to all other behaviors in that a handler will be created for this behavior, as 
well as an interface for the client app to implement the actual behavior with.  Additionally, a path recording 
system will need to be developed to generate the path recording while the tool is in use.