# Set Behavior API

Currently behaviors are created as a part of the `setBehavior` call on Actor, and return back an immutable
strongly typed behavior class of the behavior that is explicitly add through the call.  There is now a need
to configure properties on the behavior before it is added to the actor and sent down to the client.  The 
proposed changed is to deprecate the existing API for `setBehavior` and add in a new `setBehavior` that takes 
an instance of a behavior.  This way the creation of the behavior can happen before it is set on the actor, 
allowing for additional configuration by the developer.

## API

``` ts
/**
 * Sets the behavior on this actor.
 * @param behavior The type of behavior to set. Pass null to clear any behaviors on the actor.
 */
public setBehavior(behavior: Behavior) {
    if (behavior) {
        this.internal.behavior = behavior;
        this.context.internal.setBehavior(this.id, this.internal.behavior.behaviorType);
        return;
    }

    this.internal.behavior = null;
    this.context.internal.setBehavior(this.id, null);
}
```

## Example Usage 

***from input-test.ts***
``` ts
// Create an actor
this.model = MRE.Actor.CreateFromGltf(this.assets, {
    // from the glTF at the given URL, with box colliders on each mesh
    uri: `${this.baseUrl}/monkey.glb`,
    colliderType: 'box',
    // Also apply the following generic actor properties.
    actor: {
        name: 'clickable',
        parentId: root.id,
        transform: {
            local: {
                scale: { x: 0.4, y: 0.4, z: 0.4 },
                position: { x: 0, y: 1, z: -1 }
            }
        }
    }
});

// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
const buttonBehavior = new ButtonBehavior();
buttonBehavior.onHover('enter', () => {
    this.state = 1;
    this.cycleState();
});
buttonBehavior.onButton('pressed', () => {
    this.state = 2;
    this.cycleState();
});
buttonBehavior.onHover('exit', () => {
    this.state = 0;
    this.cycleState();
});

this.model.setBehavior(buttonBehavior);
```