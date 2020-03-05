# Mixed Reality Extension SDK

<img width='200' height='200' src='branding/MRe-RGB.png'/>

The Mixed Reality Extension SDK lets developers and community members extend
the [AltspaceVR](https://altvr.com/) host app's worlds with multi-user games
and other dynamic experiences.

## Prerequisites
* Install Git
* Install [Node.js 8.12](https://nodejs.org/download/release/v8.12.0/) or
newer, which includes NPM 6.4.1 or newer, from nodejs.org


## Get Started
The easiest way to start with the MRE SDK is to head over to the 
[mixed-reality-extension-sdk-samples](
https://github.com/Microsoft/mixed-reality-extension-sdk-samples) repo, and
build a sample.

If you want to build the actual SDK itself, or want to build the functional test 
showcase MRE, jump to [Build and Run section of this 
document](#How-to-Build-and-Deploy-the-SDK-and-functional-tests)

To see the APIs, jump to [SDK documentation](
https://microsoft.github.io/mixed-reality-extension-sdk/)

If you have made a game or application in Unity3D, and you want it to support
MREs, or you want to debug into the client runtime code itself, go to the [
Mixed Reality Extension Unity](
https://github.com/microsoft/mixed-reality-extension-unity) repository.
 
Other resources are on [AltspaceVR's developer page](https://developer.altvr.com/get-started/)
 

## Overview
* Written in TypeScript, and built on top of Node.js.
* Utilizes a traditional game engine-style client-server model. All logic runs
on the server, but the client performs the most CPU intensive and
latency-sensitive tasks: animation, collision, rigid body physics simulation,
rendering, and input handling.
* Hides the complexity of multi-user synchronization and prediction, so
developers focus on adding content, not debugging networking code.
* Designed to be secure for users, tolerate high latency, minimize server
activity, and seamlessly blend with the host app's native content.
* Quick to start: Clone the [samples repo](https://github.com/Microsoft/mixed-reality-extension-sdk-samples), deploy an MRE
locally, and see the extension running in [AltspaceVR](https://altvr.com/) or other host apps within minutes.
* We welcome contributions. Please see [CONTRIBUTING.md](CONTRIBUTING.md)
if you are interested in helping out.


## Features
The SDK enables you to create extensions that can
* Modify the scene graph by loading glTF assets and scene files, instantiating
primitives or the host app's built-in assets, or programmatically build meshes.
* Create actors with 3d meshes (static or skinned), realtime lights and text objects
* Create, load, and trigger keyframe animations, sounds, music, textures
* Assign rigid body properties, physics forces, collision geometry, and have
objects collide naturally with the host app world, or with other extensions.
* Filter actors and behaviors to groups of users, or even have single-user actors
* Apply click detection behaviors and register event handlers on the behaviors.
* Attach actors to host app's avatars
* Make actors grabbable and clickable when held

## Current State
Developer Preview

## Limitations
The MRE SDK has been in developer preview in AltspaceVR since December 2018, 
and while the API surface is fairly stable, internals are regularly refactored.
We strive to maintain backwards compatibility when possible, but until we ship
the 1.0 release, there will be occasional breaking changes, which will require
MRE redeploys.

The SDK does not have a feature rich set of APIs yet. We have focused on
the networking and synchronization, rather than adding more APIs. Expect this
to improve over time. Our 

The SDK deploys anywhere Node.js works.

## Goal
We want to deliver a feature-rich set of APIs, enabling creation of high
quality, rich 3d experiences. There are many features we want to add, including
* Rigid body constraints
* Input latency improvements
* Protocol optimization
* 2D UI layout system with common UI controls

However, our highest priority is reliability, predictability, and ease of use,
and as a consequence we spend much more time making sure we have a solid,
flexible infrastructureare than adding shiny new features.


## Major known Issues
* Rigid body physics state syncronization is jittery.
* Users can't reliably directly collide with rigid body objects, except by grabbing.
* A number of client-side errors don't get send to the node log, which makes
debugging hard. This includes glTF loading errors and using the wrong name
when playing animations.


## Roadmap
We are working towards 1.0 release. Please look at our [project 
page](https://github.com/microsoft/mixed-reality-extension-sdk/projects/1)
for remaining work.

## How to Build and Deploy the SDK and functional tests
From command prompt:
* `git clone http://github.com/microsoft/mixed-reality-extension-sdk`
* `cd mixed-reality-extension-sdk`
* `npm install -g lerna`
* `npm install` This will install all dependent packages. (and will do very
little if there are no changes)
* `npm run build` This should not report any errors.
* `npm start` This should print "INF: Multi-peer Adapter listening on..."
* See also: [Using Visual Studio Code instead of command line](
#Using-Visual-Studio-Code)

## Testing an MRE In AltspaceVR
* In [AltspaceVR](https://altvr.com/), go to your personal home
* Make sure you are signed in properly, not a guest
* Activate the World Editor
* Click Basics group
* Click on SDKApp
* For the URL field, please enter the URL `ws://localhost:3901`
* Click Confirm
* After the app has been placed, you will see the MRE Anchor (the white box 
with red/green/blue spikes on it), and you can use it to move the MRE around, 
and you can see the status of the MRE connection by looking at the icon on the
anchor. To hide the anchor, uncheck "Edit Mode".

You should now see a functional test load up inside AltspaceVR. 

## Pre-deployed MREs
We have deployed the hello world and functional test MREs to servers in the cloud. 
The URLs are
* ws://mres.altvr.com/helloworld
* ws://mres.altvr.com/solarsystem
* ws://mres.altvr.com/tests/latest
* ws://mres.altvr.com/tictactoe


## Using Visual Studio Code
We recommend Visual Studio Code, a lightweight code editor, which is easy to
use and offers full debugging capabilities for Node.js servers. 
* Install from here: [Visual Studio Code](https://code.visualstudio.com/)
* You may want to add the TSLint extension to get style tips - use 
View->Extensions(ctrl+shift+X), search for TSLint, click Install.
* To build: use Tasks->Run Build Task... (ctrl+shift+B), and you can select
`npm: Build` for some or all packages.
* To choose which MRE to launch: go to debugger sidebar: (ctrl+shift+D), and
from the dropdown choose desired MRE.
* To launch the MRE server: use Debug->Start Debugging (F5). To stop the
server: user Debug->Stop Debugging (shift+F5)


## Hosting and Multi-User Testing 
To learn about additional deployment options and multi-user testing in
AltspaceVR, see [DEPLOYING.md](DEPLOYING.md)


## Getting In Touch
To report issues and feature requests: [Github issues page](
https://github.com/microsoft/mixed-reality-extension-sdk/issues).

To chat with the team and other users: join the [MRE SDK discord community](
https://discord.gg/ypvBkWz).

Or attend the biweekly [AltspaceVR developer meetups](
https://account.altvr.com/channels/altspacevr).


---
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
