# Overview

Collider events from the client are broken down in to two types: Collision and Trigger.  Each of these event types are raised for one of two event states: 'enter' or 'exit'.

# Collision Event

The collision event is raised when two actors that both have colliders on them participate in a collision event, one for when the collision enters and one for when the collision exits..  This collision event will contains data that is passed to the event handlers attached for the collision event and state.

## Collision Data

Collision data is specific to only collision events and contains information on the other actor, as well as physics related information about the collision.

```ts
export interface ContactPoint {
    normal: Vector3;
    point: Vector3;
    separation: number;
}

export interface CollisionData {
    actorHit?: Actor;
    contacts: ContactPoint[];
    impulse: Vector3;
    relativeVelocity: Vector3;
}
```

# Trigger Volume Events

A trigger volume event is raised when an actor that has a collider on it enters or exits the bounds of another actor's collider that is configured to be a trigger. This trigger event will contain data that is passed to the event containining the actor id of the other actor.

# Adding and Removing Event Handlers

The collider on an actor provides an interface for adding and removing collision and trigger event handlers.  This is accomplished through two pairs of functions on the collider, one for each event category.

```ts
/**
 * Add a collision event handler for the given collision event state.
 * @param state The state of the collision event.
 * @param handler The handler to call when a collision event with the matching
 * collision event state is received.
 */
public onCollision(state: CollisionEventState, handler: CollisionHandler) {...}

/**
 * Remove the collision handler for the given collision event state.
 * @param state The state of the collision event.
 * @param handler The handler to remove.
 */
public offCollision(state: CollisionEventState, handler: CollisionHandler) {...}

/**
 * Add a trigger event handler for the given collision event state.
 * @param state The state of the trigger event.
 * @param handler The handler to call when a trigger event with the matching
 * collision event state is received.
 */
public onTrigger(state: CollisionEventState, handler: CollisionHandler) {...}

/**
 * Remove the trigger handler for the given collision event state.
 * @param state The state of the trigger event.
 * @param handler The handler to remove.
 */
public offTrigger(state: CollisionEventState, handler: CollisionHandler) {...}
```
