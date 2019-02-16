# MRE Sound API proposal

Current status - preload sounds and play sounds exist, but it doesn't store the handle or allow manipulation

## Required functionality
* preload sounds (as looping or one-shot)
* play preloaded sounds
* OPTIONALLY: load and play sounds (Basically preload, instantly play, unload upon completion)
* pause, resume, 
* stop sounds 
* set the sound state (to change volume and pitch)

## I'd especially like feedback on:

node side:
	async structure - i mostly followed what was there and it seems to work well.
	should I keep the playsound call under runtime/actor, or move to internal/actor?
	Is the assetmanager structure right? the node
	
c# side:
	is this the proper way to use asset cache?
	I reused a lot of the texture download, an
	
Not done:
	multipeer rules and synchronization - I need to dig into this 
	creating the interface handle and passing it back for pause/resume/setsoundstate/stop
	pause/resume/setsoundstate/stop
	using loadstateoptions and setsoundstateoptions during loadsound() and playsound() calls.
	

This API has been designed to follow conventions of other parts of the SDK (AssetManager for preloading,  Actor/Animation for starting/stopping/changing state). I'm very happy to change it where recommended

Should I switch over to allocating a data structure on the node side for managing the state? I don't think that'll buy anything, which is why I went with the "here's a handle".
