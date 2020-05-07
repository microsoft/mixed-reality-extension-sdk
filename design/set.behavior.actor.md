# Set Behavior API

An API is needed on the actor for the developer to be able to set a bahavior for the actor to use to 
allow fo user interaction with that actor.  The API should ensure that the behavior is tied to the one
actor it is being set on and should be flexible enough to allow setting params on the the behavior at the
time of creation or initialization.

## API

### In actor.ts
``` ts
/**
 * Sets the behavior on this actor.
 * @param behavior The type of behavior to set. Pass null to clear the behavior.
 * @param initOptions The init options object to pass to the behavior to initialize it.
 */
public setBehavior<BehaviorT extends Behavior, InitOptionsT>(
    behavior: { new(initOptions?: InitOptionsT): BehaviorT }, 
    initOptions?: InitOptionsT
): BehaviorT {
    if (behavior) {
        const newBehavior = new behavior(initOptions);

        this.internal.behavior = newBehavior;
        this.context.internal.setBehavior(this.id, this.internal.behavior.behaviorType);
        return newBehavior;
    }

    this.internal.behavior = null;
    this.context.internal.setBehavior(this.id, null);
    return null;
}
```