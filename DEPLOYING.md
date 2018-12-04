# Mixed Reality Extension SDK Deployment Guide

There are 4 categories of deployment

1. Kicking the tires - deploy Node.JS server to your local PC (localhost), and test the MRE as a single user
2. Kicking the tires together - share the locally deployed server with friends
3. Deploy to a low-cost external hosting service 
4. Deploy to an enterprise grade cloud service

Regardless of the deployment category, you will end up with a URL to the deployed server. You can then use that in your host app (AltspaceVR)


---
## Kicking the Tires
If you follow the building instructions from the [Sample Repo's README.md](https://github.com/Microsoft/mixed-reality-extension-sdk-samples/blob/master/README.md#BuildAndRun), you will be able to use the URL `ws://localhost:3901` to see a hello world sample.

If you follow the functional test building instructions from [README.md](https://github.com/Microsoft/mixed-reality-extension-sdk/blob/master/README.md#BuildAndRun), use the URL `ws://localhost:3901?test=rigid-body-test` to see a functional test scene. 


## Kicking the Tires Together
While developing an MRE, you may want to test with other people, so you will need to make the MRE's endpoint visible publicly. The easiest way is to use a service like [ngrok](https://ngrok.com/), which gives new URL that will work for you and your friends. Using ngrok, the URL above would be rewritten to something like this: `ws://c0bbc9c9.ngrok.io?test=rigid-body-test`. ngrok itself is a command line utility. To run ngrok and connect it to your experience:

On a command line
* cd to the folder where you unzipped ngrok.exe
* run the command `ngrok http 3901`


## Deploy to a low-cost external hosting service 
Coming Soon. For now we recommend testing localhost or ngrok deploys only.


## Deploy to an enterprise grade cloud service
Coming Soon.


---
## Testing in AltspaceVR
Regardless of the deployment method you use, you will end up with a URL to the deployed server. This is how the host app connects to the MRE. Use that URL with the [AltspaceVR testing instructions here](https://github.com/Microsoft/mixed-reality-extension-sdk-samples/blob/master/README.md#TestingInAltspaceVR), 


You should now see an MRE running it from AltspaceVR.


## Inviting Friends in AltspaceVR
If your URL is publicly visible, you can invite friends into your AltspaceVR homespace to see the MRE. On the Worlds page, on the Homespace tab, make sure Allow Friends is checked. If you are in your homespace, your friends can click on you in the friends tab, and click Go To, and they will enter to your homespace.

Alternatively, you can create a party portal to bring friends in at the same time. On the Discover page, under Top Picks For You, hover over the Homespace icon and click Portal. Any user that clicks on the portal before you choose launch will follow you into the homespace.
