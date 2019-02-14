# MRE Sound API proposal

This is node.js side only. It doesn't actually do anything yet.

## Required functionality
* preload sounds (as looping or one-shot)
* play preloaded sounds
* load and play sounds (Basically preload, instantly play, unload upon completion)
* pause, resume, 
* stop sounds 
* set the sound state (to change volume, pitch, and where possible seek)

## Design thoughts

(Feel free to comment on each item separately)

I'm using assetmanager to for the preloading sound to ask the client to load a sound resource, and return a handle. This is therefore are not instant, but return a promise.

All sounds play on an actor, and the play calls therefore happen on the actor.

PlaySound are played by passing in a sound resource ID, and instantly return a sound instance ID.

LoadAndPlaySound takes a URI, and returns a promise to a sound instance ID when the primary client has started playing the sound.

The sound instance doesn't store any data on the server at all, it lets the client manage the instance fully. It's up to the client to take the sound instance handle and tweak it if necessary. Sound instance handles expire the moment a non-looping sound reaches the end, or (for both looping/non-looping sounds) when the user calls stop() for that sound instance. 
Sound instance handle is used with the pause/resume/stop/setsoundstate api calls.


## I'd especially like feedback on:

This API has been designed to follow conventions of other parts of the SDK (AssetManager for preloading,  Actor/Animation for starting/stopping/changing state). I'm very happy to change it where recommended

Should I switch over to allocating a data structure on the node side for managing the state? I don't think that'll buy anything, which is why I went with the "here's a handle".
