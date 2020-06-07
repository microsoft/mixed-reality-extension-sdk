## Back Compatibility Plan
For MRE, back compatibility is an important promise to all stakeholders of the MRE ecosystem. This proposed change will allow MRE client plugins to support multiple "generations" of the MRE SDK. Each generation may have functionality additions or changes in both API surface and protocol, and once a generation goes from preview to finalized release, it's locked for good, and a new generation enters preview phase.

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
Pros for 1: it's easier to have a single output DLL than multiple, as build scripts don't need to be updated when a generation is added. Total binary size is smaller than 2, as compiler will probably optimize out many functions that are unchanged across generations. Con: Higher build time for the DLL.
I recommend option 1. 


### Summary of Recommended Design
We'll duplicate the files into a different subfolder per generation, add a generation-specific prefix to each file, and leave only the absolutely minimal set of files outside this folder. All of the code will be built into a single DLL.

### Example
For example, imagine the MRE SDK is at version 2.17.0. It would then support 3 generations of MREs: 1.0 (gen 1), 2.0 (gen 2), and 2.17.0 (pre-release for gen 3). 
Any host app that includes this plugin will get permanent support for gen 1 and 2, and un-guaranteed prototype of gen3. If the host app later updates to SDK version 2.25.0, then gen 1 and gen 2 MREs run unchanged, but MREs built with gen3 version 2.17 to 2.24 may need to be updated 

### Code to be shared across generations
The more code is duplicated, the less chance of changes having side effects that spill into finalized generations, so the goal is to move as much as possible to be generational. There is *some* code that must be shared, though, in particular anything that interfaces with the main engine.

#### Shared
* Initial Connection code. Reason: until host connect to the MRE, it doesn't know the MRE's generation.
* Code that the host app uses to initialize the MRE system and initialize a single MRE. Reason: host app doesn't need to care about which version each MRE is (MREAppsAPI)
* Host app hooks related to input/user/attachments/createfromlibrary/video player. Reason: the host app generally doesn't care about which version an MRE is, and therefore should call into generation-agnostic hooks. Each generation-agnostic hook should then call into the generation-specific code with the appropriate parameters.
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



