# Pen Behavior

The Pen behavior is a method of recording the path by which a user moves a grabbed object so that various scenearios 
can be carried out that wish to capture the virtual drawing of a user.  This behavior will carry with it client side visuals
to ensure low-latency feedback, but will supply the complete curve data needed by the MRE app to acto on once the drawing is done.

## Architecture

Create a new behavior that will enable grabbable on the actor that the behavior is added to.  This behavior will then allow the user
to execute a primary action to begin recording the transform changes over time to use it to build a spline curve.  The MRE runtime will
generate a wet ink effect and a mesh to apply to this spline curve.  Callbacks will occur for when the actor with the behavior has been
picked up and dropped, as well as when the drawing has started and stopped.  There will be transform data sent up to the MRE at a set 
frequency while the drawing is active to facilitate spline generation by the MRE app.

### Behavior
``` ts
/**
 * Button behavior class containing the target behavior actions.
 */
export class PenBehavior extends TargetBehavior {
	private _hold: DiscreteAction = new DiscreteAction();
	private _drawing: DiscreteAction = new DiscreteAction();

	/** @inheritdoc */
	public get behaviorType(): BehaviorType { return 'pen'; }

	public get hold() { return this._hold; }
	public get drawing() { return this._drawing; }

	public onDrawDataReceived((data: Transform[]) => void);
```

## Network

The network messages for this behavior will use the standard behavior payloads for actions started and stopped.  The two actions supported 
by the Pen behavior are hold (begin/end) and drawing (begin/end).

In addition to the standard `PerformAction` payload, there will need to be a second message that is used for sending transform recordings
up to the MRE app on a set frequeny cadence.  This payload may look something like this:

``` ts
export type DrawRecording = Payload & {
	type: 'draw-recording';
	actorId: drawingActor;
	data: Transform[];
}
```

## Sync layer considerations

Behaviors already have sync layer filtering to ensure that the action messages are for the client they happen on to the MRE app only.  Grab 
also has special sync filtering based on the client that the grab is happening and the rest of the clients.  The additional sync concerns will
center around the recording data being sent to the MRE app from the pen behavior.  That is data that only needs to come to the MRE app and does
not require synchronizing to other clients.  What the MRE app does with the transform data recorded by the pen behavior will be handled as a part
of the drawing design spec.

## Client implementation

The client will require the addition of a new pen behavior for the host app to implement, as well as a draw recording system that will facilitate
the recording of the transform data over time while a draw is happening and to send that data in chunks during the draw based on a set frequency.