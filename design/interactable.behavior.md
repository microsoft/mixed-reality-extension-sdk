#  Interactable Behavior

The interactable behavior allows the user to assign this behavior to an actor so that the actor can be held and
used.

## Architecture

Create a new behavior that is an `InteractableBehavior` for being able to add to an actor.

``` ts
/**
 * Interactable behavior class containing the target behavior actions.
 */
export class InteractableBehavior extends TargetBehavior {
	private _holding: DiscreteAction = new DiscreteAction();
	private _using: DiscreteAction = new DiscreteAction();

	/** @inheritdoc */
	public get behaviorType(): BehaviorType { return 'interactable'; }

	public get holding() { return this._holding; }
	public get using() { return this._using; }

}
```

## Network

The network messages will use the behavior payloads of SetBehavior and PerformAction payloads the same way all
behaviors do.

## Sync layer considerations

Synchronization will follow the same procedure as all other behaviors.  Nothing special about this behavior.

## Client implementation

Client implementation is similar to all other behaviors in that a handler will be created for this behavior, as 
well as an interface for the client app to implement the actual behavior with.