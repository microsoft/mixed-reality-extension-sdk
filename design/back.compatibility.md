## Back Compatibility Plan
For MRE, back compatibility is an important promise to all stakeholders of the MRE ecosystem. This proposed change will allow MRE client plugins to support multiple "generations" of the MRE SDK. Each generation may have functionality additions or changes in both API surface and protocol, and once a generation goes from preview to finalized release, it's locked for good, and a new generation enters preview phase. 
When a generation is locked, it will generally only receive minor hotfixes that are sure to not change functionality of shipped MREs.

## Stakeholders
Each stakeholder have a number of different expectations:
* MRE SDK Core Dev team: I can keep implementing new features or change the protocol at a high pace, without fear of breaking MREs or Host Apps using finalized generations. I can plan a feature set for a new generation, and iterate on it until final release of a generation, without worrying about back compatibility.
* MRE SDK Users (MRE Devs): Once I deploy my MRE built with a finalized SDK of any generation, it should keep working forever on my target host apps, regardless of host app updates. Even if I rely on undefined behavior, and my app runs by accident, it should keep running forever.
* Host App Devs: Once I deploy my host app, with the SDK client plugin, it will run all MREs built with a finalized generation of the SDK supported by the client plugin. My app can seamlessly connect to MREs with different SDK generations at the same time - finalized and preview. If I update the client plugin, it should not change behavior on any existing MREs, except may add support for newer generations of MREs. I can update the plugin when I want to, but MRE client plugin updates should never force me to update my app.
* Non-Unity Client Plugin Devs: Once the Unity client plugin has a finalized release for a generation, I know exactly which features I need to implement to support that generation, and they will never change. I can implement new features and don't have to look back.

In other words, the MRE core dev team will not be able expect other stakeholders to update host apps, alternative client plugins, or deployed MREs ever. And MRE dev team should never even try to fix client plugin bugs that can possibly change functionality in a final version of a generation - MREs may be relying on broken or unidentified behavior, and that's perfectly allowed.
 

Note that these rules only apply to the client plugin side, not to the server (SDK) side itself. The server side itself only needs to support a single generation, because MRE devs are free to use any older NPM package from any shipped generation to make their MREs. Therefore it is safe for the core dev team to check in hotfixes for the NPM package; MRE devs are never required to take an update, but if they do they would be expected to test the app.

## Design Options

I considered two basic approaches to implementing multi-generation support
1. conditional checks sprinkled in whenever changes are applied("if (generation==2) then do A else do B". Pro: it's easy to understand the concept, and easy to start. Con: extremely error prone and hard to test.
2. complete copy of the generation-specific code (i.e. almost all of the code in the dll). Pro: Minimizes risk of errors. Con: May bloat the plugin size, source tree size, and compile time. Still have to watch out for changes in the wrong version.

The obvious choice here is 2. Approach 1 would causes things to break often for no reason, no matter how careful developers are. 

### Source Code Management
Here are 2 options to managing the source code
1. move all the generation-specific code into a subfolder per generation - this is where the preview generation is worked on. When finalizing a generation and starting a new preview generation, create a copy of the preview generation folder. Change the namespace in the subfolder. Add a generation-specific prefix on each source file's filename
2. move all generation-specific code into a separate repository, and have the main repository include this repository as a submodule for each generation.

* Pros for 1: Easy to use with git. 
* Cons for 1: It's clunky to have a prefix on filenames (but makes it much harder to accidentally modify things in a final generation - many tools highlight filename but not path). It's still possible to modify the wrong generation's files in the repo.
* Pros for 2: Makes it harder to do accidental checkins in the wrong repo - you commit into a specific version.
* Cons for 2: git submodule workflow is clunky, not integrated well with visual git tools. While it seems like meging across generations is easier, it's not something we'll see in practice as fixing finalized generations is not something we should be doing.

I recommend version 1. The pain of the git submodule workflow, and loss of productivity is not worth the minor benefits of 2

### Final Binaries
Here are two options for building the the binaries
1. Build a single DLL that includes all generations, with a small bit of generation-shared code for connecting to a server, finding the server version, and choosing the generation-specific mre. 
2. Build one DLLs per generation, plus a management DLL. 
* Pros for 1: it's easier to have a single output DLL than multiple, as build scripts don't need to be updated when a generation is added. Total binary size is smaller than 2, as compiler will probably optimize out many functions that are unchanged across generations. 
* Pros for 2: Lower build time for the DLLs, you can develop on just the generation you need, and host apps get the freedom to choose which generations to support (though we recommend host apps support all previous generations.

After discussing this, we're choosing to go with #2. If combined file size of all DLLs ends up being a concern, we can attempt merging to see if there really is a size boost by merging them, but that would be an unnecessary optimization at this point. 


### Summary of Recommended Design
We'll duplicate the files into a different subfolder per generation, add a generation-specific prefix to each file, and leave only the absolutely minimal set of files outside this folder. 
There would be a shared DLL, and a DLL per generation. We'd probably create a couple of separate solution files - one sln that references all the csprojs for all generation dlls+the shared dll cspro, and one sln per generation that includes just a single generation+shared dll, for development use.

### Example
For example, imagine the MRE SDK is at version 2.17.0-prerelease (exact formatting TBD). The major version (2) indicates the highest generation, so 2.17.0 would indicate that gen 0 and gen 1 are completed, and gen 2 is in active development. if the version number didn't include -prerelease then it would be gen 2 would also be considered final.
 
Any host app that includes the 2.17.0-prerelease plugin will get permanent support for gen 0 and 1, and a temporary prototype of gen 2, which will be deprecated once gen 2 is finalized. Because gen 2 is in development, back compatibility is not guaranteed between prereleases, and therefore the SDK may be backwards compatible with some (but not all) previous prereleases for gen 2. The runtime and MRE will simply refuse connecting if they are incompatible. As a consequence, if the host app were to update to SDK version 2.25.0-prerelease, then gen 0 and gen 1 MREs would run unchanged, but gen 2 MREs that ran on the 2.17.0-prerelease runtime may not run anymore. 

### Code to be shared across generations
The more code is duplicated, the less chance of changes having side effects that spill into finalized generations, so the goal is to move as much as possible to be generational. There is *some* code that must be shared, though, in particular anything that interfaces with the main host app.

This sharing will generally be accomplished by having "shared" functions whose main job it is to route calls/data between the host app and the right generation. While the generation-specific code shouldn't change as more generations are added, this shared routing layer will change (and mostly grow) as new functionality is added

#### Shared
* Initial Connection code. Reason: until host connect to the MRE, it doesn't know the MRE's generation.
* Code that the host app uses to initialize the MRE system and initialize a single MRE. Reason: host app doesn't need to care about which version each MRE is (MREAppsAPI). The actual Apps API will change as generations are added, but it lives in the shared code there's just one API for the host app to call.
* Host app hooks related to input/user/attachments/createfromlibrary/video player. Reason: Again, the host app generally doesn't care about which version an MRE is, and therefore should call into generation-agnostic hooks. Each shared hook should then call into the generation-specific code with the appropriate parameters (and generation-specific code that needs to call back to the host app should call into shared code that then routes to the host app)
* Logging/Debugging interface. While the logging functions are generational, the final formatted output should route back to the main engine through a generation-agnostic hook. Reason: the engine shouldn't worry ab
* Network protocol/packet parsing (like newtonsoft.json). Reason: it's used to generate initial connection. Additional optimized protocols may be added later, which could probably be generational. 
* RPC interface. Reason: This is used for MREs to talk directly to the main engine without going through the SDK, so it's host-app specific.

#### Per generation
* Anything that touches the scene graph - animation, physics, rendering, geometry, sound, video
* Anything that touches assets - asset cache, shaders, procedural toolkit (including defaultmaterial)
* Anything downloading files
* External libraries that can change over time (including the gltf library)
* Anything else, really, including utility functions, patching, payloads
	
### Steps
1. Move almost all files into a gen1 folder (everything is considered generational unless explicitly chosen)
2. Rename files
3. Rename namespaces inside gen1 and shared folders
4. Move mreapi to shared. MREAppsAPI probably needs to be created per generation, and accessed through the mre instance, rather than from the mreapi? CreateMixedRealityExtensionApp needs to be extracted out to shared code.
5. Split MixedRealityExtensionApp - in two - connection+lifetime is shared, and everything else in a class instantiated after connection is created
6. Create shared wrappers for all client hooks
7. Import gltf into the gen1 folder and search-and-replace namespace



