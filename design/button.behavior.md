# Button Behavior

Button behavior is the high level representation of how an MRE actor should behave as a button.  This behavior consists of two actions
that occur on the object when it is targeted and when button is pressed or clicked.  As part of these interactions, the point of targeting
of the button will be passed along as additional data to the app for consumption.

Button Behavior Actions:
- `hover` - The action that occurs when the button is targeted by the host app input system. 
    - Hover states: `enter`, `hovering`, `exit`
- `click` - The action that occurs when a complete click has happened on the button consisting of both a button pressed and button released event. 
    - Click states: None.  This is a single atomic event.
- `button` - The action that occurs when the button interaction state has changed from being pressed and then released.
    - Button states: `pressed`, `holding`, `released`
    
Button Event Data:
- `targetedPoints` - The collection of target points for the current state event of the action.  This collection is of `PointData` that contains both app space and local target object space versions of the points.  This collection will always contain one or more points depending on the specific event that this data is being tied to.

Button Event Data Per Action:
- Hover Action:
	- `enter` - single app coordinate target point for where the hover is first entered.
	- `hovering` - collection of app coordinate target points for the time while hovering is occuring, sent at a set frequency.
	- `exit` - single app coordinate target point for where the hover was exited.
- Click Action:
	- There is only the click state and will contain the single app coordinate target point of the click action.
- Button Action:
	- `pressed` - single app coordinate target point for where the pressed event began.
	- `holding` - collection of app coordinate target points for the time while the button is held down, sent at a set frequency.
	- `released` - single app coordinate target point for where the button is released.
	
## Architecture

### PointData
``` ts
/**
 * Interface that represents a point in space as a local space point and an app space point.
 */
export interface PointData {
	/**
	 * The app coordinate space target points collected for the event
	 */
	appSpacePoint: Vector3Like;

	/**
	 * The local coordinate space target points collected for the event.
	 */
	localSpacePoint: Vector3Like;
}
```

### ButtonEventData
``` ts
/**
 * Interface that represents the button event data passed along though event handler functions.
 */
export interface ButtonEventData {
	/**
	 * The collection of target point data.
	 */
	targetedPoints: PointData[];
}
```

### Button Behavior Handler API
``` ts
* Add a hover handler to be called when the given hover state is triggered.
 * @param hoverState The hover state to fire the handler on.
 * @param handler The handler to call when the hover state is triggered.
 * @return This button behavior.
 */
public onHover(hoverState: 'enter' | 'hovering' | 'exit', handler: ActionHandler<ButtonEventData>): this;
    
/**
 * Add a click handler to be called when the given click state is triggered.
 * @param handler The handler to call when the click state is triggered.
 * @return This button behavior.
 */
public onClick(handler: ActionHandler<ButtonEventData>): this;

/**
 * Add a button handler to be called when a complete button click has occured.
 * @param buttonState The button state to fire the handler on.
 * @param handler The handler to call when the click state is triggered.
 * @return This button behavior.
 */
public onButton(buttonState: 'pressed' | 'holding' | 'released', handler: ActionHandler<ButtonEventData>: this;
```

## Network

The button behavior does not require any additional networking considerations as it will use the existing network messages within the behavior system.

## Client

Client work will include implementing the runtime behavior handler as well as expoing the factory method for the host app to implement within its user interaction system.
