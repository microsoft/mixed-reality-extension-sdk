# Mixed Reality Extension SDK

The Mixed Reality Extension SDK lets developers and community members extend the AltspaceVR host app's worlds with multi-user games and other dynamic experiences.


## Overview
* Written in TypeScript, and built on top of Node.js.
* Utilizes a traditional game engine-style client-server model. All logic runs on the server, but the client performs the most CPU intensive and latency-sensitive tasks: animation, collision, rigid body physics simulation, rendering, and input handling.
* Hides the complexity of multi-user synchronization and prediction, so developers focus on adding content, not debugging networking code.
* Designed to be secure for users, tolerate high latency, minimize server activity, and seamlessly blend with the AltspaceVR host app's native content.
* Quick to start: Clone this repo, deploy a sample locally, and see the extension in the host app within minutes.
* We welcome contributions. Please see CONTRIBUTING.md if you are interested in helping out.


## Features
The SDK enables you to create extensions that can
* Modify the scene graph by loading GLTF assets and scene files, instantiating primitives or the host app's built-in assets, or programmatically build meshes.
* Create or load keyframe animations.
* Assign rigid body properties, physics forces, collision geometry, and have objects collide naturally with the host app world, or with other extensions.
* Apply input behaviors and register event handlers on the behaviors.


## Current State
Developer Preview


## Limitations
This is an early developer preview, so there will be rough edges and bugs.

We would love for you to experiment with this SDK by deploying locally or using [ngrok](https://ngrok.com/) to invite friends to join while you test. However, during the developer preview phase we don't recommending deploying your app to cloud services. Until we reach the Feature Complete milestone, and in parallel with the AltspaceVR integration, there will be occasional breaking changes, which will require server redeploys.

The SDK also does not have a feature rich set of APIs yet. We have focused on the networking and synchronization, rather than adding more APIs. Expect this to improve over time.

The SDK should deploy anywhere Node.js works.


## Goal
We want to deliver a feature-rich set of APIs, enabling creation of high quality, rich 3d experiences. There are many features we want to add, including
* User masking - hide actors and disable behaviors for a subset of users
* streaming and single-shot sound playback
* Additional input behaviors, such as grab&throw
* 2D UI layout system with standard UI controls
* Particle system
* Realtime lighting
* Rigid body constraints
* Input latency improvements
* Protocol optimization



## Major known Issues
* Rigid body physics state is not synchronized properly between users, so rigid body experiments should be done alone.
* Text labels always renders on top of all geometry


## Prerequisites
* Install a recent version of Node.js [8.12](https://nodejs.org/download/release/v8.12.0/) or newer, including NPM 6.4.1 or newer from nodejs.org
* Recommended: Install [Visual Studio Code](https://code.visualstudio.com/)


## How to get, build, run, and test 
From command prompt:
* `git clone http://github.com/microsoft/mixed-reality-extension-sdk`
* `cd mixed-reality-extension-sdk\node`
* `npm install` This will install all dependent packages. (and will do very little if there are no changes)
* `npm run build` This should not report any errors.
* `cd packages/apps/functional-tests`
* `node .` (include the period) This should print "INF: Multi-peer Adapter listening on..."
* See also: [Using Visual Studio Code instead of command line](#using_visual_studio_code_instead_of_command_line)

In AltspaceVR
* Go to your personal home
* Activate the Space Editor
* Click Basics group
* Click on SDKApp
* For the URL type in `ws://localhost:3901?test=rigid-body-test`
* Click Confirm

You should now see a functional test scene load up inside AltspaceVR. Congratulations, you have now deployed a Node.js server on your local machine and connected to it from AltspaceVR.


## Inviting friends
The example above should work well for single user testing, but you probably want to do things together with friends, right?
If you want other people to be able to join your experience, you need to make its endpoint visible publicly. The easiest way is to use a service like [ngrok](https://ngrok.com/), which gives a link you can use in the SDKApp URL field (instead of localhost) that will work for you and your friends. Using ngrok the SDKApp URL above would be rewritten something like this: ws://c0bbc9c9.ngrok.io?test=rigid-body-test. ngrok itself is a command line utility. To run ngrok and connect it to your experience:

On a command line
* cd to the folder where you unzipped ngrok.exe
* run the command `ngrok http 3901`

To invite friends into your AltspaceVR homespace, on the Worlds page, on the Homespace tab, make sure Allow Friends is checked. If you are in your homespace, your friends can click on you in the friends tab, and click Go To, and they will enter to your homespace

Alternatively, you can create a party portal to bring friends in at the same time. On the Discover page, under Top Picks For You, hover over the Homespace icon and click Portal. Any user that clicks on the portal before you choose launch will follow you into the homespace.


## Deploying to an external server instance
For now we recommend testing localhost or ngrok deploys only. 

### Using Visual Studio Code instead of command line
To build: use Tasks->Run Build Task... (ctrl+shift+B), and you can select "npm: Build" for any folder (packages, libs, samples)
To choose which MRE to launch: go to debugger sidebar: (ctrl+shift+D), and from the dropdown choose desired MRE
To start the server: use Debug->Start Debugging (F5) - Visual Studio Code has full debugging support for Node.js servers.


## Roadmap
We prioritize quality over dates, but a reasonable guess would be approximately
* December 2018 - inital public preview released
* January/Febraury 2019 - regular beta updates. Occasional breaking changes.
* March 2019 - feature complete release. At this point we expect no breaking changes.

## Getting In Touch
To report issues and feature requests: [Github issues page](https://github.com/microsoft/mixed-reality-extension-sdk/issues) 

To chat with the team and other users: join [AltspaceVR SDK Slack channel](http://sdk-slackin.altvr.com/)

Or attend the biweekly [AltspaceVR developer meetups](https://account.altvr.com/channels/altspacevr)


## Reporting Security Issues

Security issues and bugs should be reported privately, via email, to the Microsoft Security
Response Center (MSRC) at [secure@microsoft.com](mailto:secure@microsoft.com). You should
receive a response within 24 hours. If for some reason you do not, please follow up via
email to ensure we received your original message. Further information, including the
[MSRC PGP](https://technet.microsoft.com/en-us/security/dn606155) key, can be found in
the [Security TechCenter](https://technet.microsoft.com/en-us/security/default).


## License

Code licensed under the [MIT License](https://github.com/Microsoft/mixed-reality-extension-sdk/blob/master/LICENSE.txt).


## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
