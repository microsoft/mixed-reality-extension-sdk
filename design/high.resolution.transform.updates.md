# High Resolution Actor Transform Updates

There are cases that a developer may want a higher resolution of transform updates that occur for an actor.
To facilitate this and allow for still having a regulated bandwidth, we can add an additional API on the actor
to allow for a developer to register/de-register for high resolution updates that would give an array of transforms
containing the full high resolution path that occured for the actor during the 10 hz regulated network update.

## API

 A new actor API will be exposed to allow a developer to register and de-register for high resolution
 transform updates.  

``` ts
/**
 * Add a callback to the tool behavior to receive path updates for while the tool is being used
 */
public onHighResTransfromUpdate((path: Transform[]) => void) {
    // Path callback registration.
    // Enable high resolution updates on the client.
}

/**
 * Remove a callback to the tool behavior to receive path updates for while the tool is being used
 */
public offHighResTransfromUpdate((path: Transform[]) => void) {
    // Path callback de-registration.
    // Disable high resolution updates on the client.
}
    
```

## Network

The actor update structure and payload will now need to be able to accept an array of transforms per update.
This array would contain one transform in the case of normal resolution transform updates, and more in the
case that high resolution transform updates were enabled for the actor.

## Client Implementation

The client side changes will require a subscription mechanism on the actor runtime instance to signal that 
high resolution updates need to be gathered for the actor during a fixed update interval and queuded to be 
sent up with the normal 10 hz update message for the actor.