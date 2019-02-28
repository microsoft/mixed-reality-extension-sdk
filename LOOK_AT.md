In this iteration, LookAt is implemented as an actor component. It has three fields:
- actorId: The actor to face toward.
- mode: The LookAtMode (unchanged from before).
- backward: Look away from the target rather than toward.

Actors can face other actors, not users. At least not directly. Facing a user is achieved by attaching an empty object to the user and looking at it instead.

I chose to not support offset rotation for now. Offset can be achieved by adding an empty object at an offset from the actor you're appearing to face. Bonus: That empty object can be animated for an interesting effect.

In this implementation, the LookAt component is communicated to the client via actor patch.
