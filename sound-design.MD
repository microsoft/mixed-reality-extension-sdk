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
	Is the assetmanager structure right? it calls enqueueLoadSoundPromise when starting to load, and after a sound is loaded, i need to understand the logic behind this pattern (it matches a pattern from other loading code)
	
c# side:
	I reused a lot of the texture download, any concerns with my usage?
	
Not done:
	multipeer rules and synchronization - I need to dig into this 
	creating the interface handle and passing it back for pause/resume/setsoundstate/stop
	pause/resume/setsoundstate/stop
	using loadstateoptions and setsoundstateoptions during loadsound() and playsound() calls.
