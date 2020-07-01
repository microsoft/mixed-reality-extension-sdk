# Behavior System

The behavior system is responsible for providing the abstracted user interaction model for MRE Apps and how the user can interact with
the various components of an MRE App.  It is based on the concept of high level behaviors that are applied to actors to make the actor
"behave" like that particular interaction behavior.

## Architecture

The system is comprised of several layers and components that make up the system.

### SDK Components and Layers

- Behavior
    - Actions
    - Action Handlers
    - Action Data

### Runtime Components and Layers

- Behavior Context
    - Action Handlers
    - Action Data
- Behavior Plugin Interface
- Behavior Factory Plugin Interface

## Network

- SetBehavior Payload
- PerformAction Payload

## Sync layer considerations

We sync behaviors from all clients in the server.  All filtering is handled in the runtime.

## Client implementation

Client runtime is responsible for getting the concrete host app implementation of the behaviors through the host app implementation
of the `IBehaviorFactory`, and supplying the necessary context for the host app to raise input events on.  The permission system is
responsible for enabling or disabling the behavior system per user, or globally on the client if there is no user interacting with the
app at all for that client.

### Permission System Handling Per Case on a Client

1.  Single User No User Interaction Permission Given

Since there is no other users in the host app that have enabled user interaction, we do not add behaviors on this client when they are 
set from the App.

2. Single User With User Interaction Permission Given

Client will add behaviors whenever they are set from the app and will send events when the user interacts with them inside the host app
implementation.

3. Multiple Users Where a Subset Have Given Permission

Client will add behaviors to the actors as they are set from the app.  The runtime will filter events from the host app by user id, and
send only the events to the server for users that have given permission for user interaction.  It will be up to the host app implementation
to handle any targetability and cursor interactions with this actor by way of the `IMixedRealityExtensionApp` API that exposes the method
`IsInteractableForUser(IUser user)`.

4. Multiple Users Where All Users Have Given User Interaction Permission

Client will add behaviors to all actors as thay are set from the app, and will do no filtering of any of the events.

5. Multiple Users Where None Have Given User Interaction Permission

Client will not add any behaviors to actors when they are set from the app, as there are no users interacting with the app on this client.

## Example Usage

``` ts
// Create an actor
this.buttonModel = MRE.Actor.CreateFromGltf(this.assets, {
    // from the glTF at the given URL, with box colliders on each mesh
    uri: `${this.baseUrl}/button.glb`,
    colliderType: 'mesh',
    // Also apply the following generic actor properties.
    actor: {
        name: 'submitButton',
        parentId: root.id,
        transform: {
            local: {
                scale: { x: 0.4, y: 0.4, z: 0.4 },
                position: { x: 0, y: 1, z: -1 }
            }
        }
    }
});

const buttonBehavior = buttonModel.SetBehavior(MRE.ButtonBehavior);

penBehavior.onClick((user, buttonEventData) => {
	// Submit some user action.
});
```