# Pen Behavior

The pen behavior is a method of recording the path by which a user moves a grabbed object that they activate so that various scenearios 
can be carried out that wish to capture the virtual drawing of a user.  This behavior will carry with it client side visuals
to ensure low-latency feedback, but will supply the complete curve data needed by the MRE app to acto on once the drawing is done.
The `PenBehavior` will be an extension of the `ToolBehavior`.

## Architecture

There will be a new `PenBehavior` that extends the `ToolBehavior` that will have the ability to generate a wet ink effect along the use 
path on the client and provide the use path to the MRE app for generating a spline curve asset that could have a mesh to applied to it
before sending it to all the clients to render. and a mesh to apply to this spline curve.

### Behavior
``` ts
/**
 * Pen behavior class containing the target behavior actions.
 */
export class PenBehavior extends ToolBehavior {
	/** @inheritdoc */
	public get behaviorType(): BehaviorType { return 'pen'; }

	public onDrawEventReceived((drawData: Partial<DrawDataLike>[]) => void) {
		// Register for draw events.
	}

	public offDrawEventReceived((drawData: Partial<DrawDataLike>[]) => void) {
		// Unregister for draw events.
	}
```

## Network

The network messages for this behavior will use the standard behavior payloads for actions started and stopped.  The two actions supported 
by the Pen behavior are hold (begin/end) and drawing (begin/end).

In addition to the standard `PerformAction` payload, there will need to be a second message that is used for sending draw event data up to 
the MRE app on a set frequeny cadence.  This payload may look something like this:

``` ts
/**
 * @hidden
 * Engine to app. Send draw data from a draw event on the client up to the app.
 */
export type DrawEventUpdate = Payload & {
	type: 'draw-event-update';
	penActorId: Guid;
	drawData: Partial<DrawDataLike>[];
};
```

## Sync layer considerations

Behaviors already have sync layer filtering to ensure that the action messages are for the client they happen on to the MRE app only.  Grab 
also has special sync filtering based on the client that the grab is happening and the rest of the clients.  

## Client implementation

The client will require the addition of a new pen behavior for the host app to implement, as well as a draw recording system that will facilitate
the recording of the transform data over time while a draw is happening and to send that data in chunks during the draw based on a set frequency.

## Example Usage

``` ts
// Create an actor
this.penModel = MRE.Actor.CreateFromGltf(this.assets, {
    // from the glTF at the given URL, with box colliders on each mesh
    uri: `${this.baseUrl}/pen.glb`,
    colliderType: 'mesh',
    // Also apply the following generic actor properties.
    actor: {
        name: 'penTool',
        parentId: root.id,
        transform: {
            local: {
                scale: { x: 0.4, y: 0.4, z: 0.4 },
                position: { x: 0, y: 1, z: -1 }
            }
        }
    }
});

const penBehavior = Actor.SetBehavior<PenBehavior>();

penBehavior.onDrawEventReceived((drawData) => {
	// Hypothetical spline generator tool in node.
	const path = drawData.map(dd => dd.transform);
	const spline = SplineGenerator.generateSpline(path);
	// Generate a mesh from the spline and use it to create a new actor at the point of origin of the draw.
});
```