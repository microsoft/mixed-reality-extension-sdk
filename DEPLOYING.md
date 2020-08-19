# Mixed Reality Extension SDK Deployment Guide

There are 4 categories of deployment

1. Kicking the tires - deploy Node.JS server to your local PC (localhost), and
test the MRE as a single user.
2. Kicking the tires together - share the locally deployed server with friends.
3. Deploy to a low-cost external hosting service.
4. Deploy to an enterprise grade cloud service.

Regardless of the deployment category, you will end up with a URL to the 
deployed server. You can then use that in your host app (AltspaceVR)


---
## Kicking the Tires
If you follow the building instructions from the [Sample Repo's README.md](
https://github.com/Microsoft/mixed-reality-extension-sdk-samples/blob/master/README.md#BuildAndRun),
you will be able to use the URL `ws://localhost:3901` to see a hello world
sample.

If you follow the functional test building instructions from [README.md](
README.md#BuildAndRun), use the URL `ws://localhost:3901?test=rigid-body-test`
to see a functional test scene. 


## Kicking the Tires Together
While developing an MRE, you may want to test with other people, so you will
need to make the MRE's endpoint visible publicly. The easiest way is to use a
service like [ngrok](https://ngrok.com/), which gives new URL that will work 
for you and your friends. Using ngrok, the URL above would be rewritten to
something like this: `ws://c0bbc9c9.ngrok.io?test=rigid-body-test`. ngrok
itself is a command line utility. To run ngrok and connect it to your
experience:

On a command line
* cd to the folder where you unzipped ngrok.exe
* run the command `ngrok http 3901`

Note the forwarding address from the nkgrok command above. In order to properly serve assets, you will need to update the WebHost's baseUrl (in server.ts in the sample code) to match this forwarding address.

## Deploy to a Free or Low-Cost Cloud Service

There are many free or low-cost cloud hosting services available. We list but a
few of them here.

### opeNode.io

The [opeNode.io](https://www.openode.io/) platform offers a free starter plan that gets you
up and running quickly without having to provide a payment method. Deploying apps
is straight forward using their command line tool, and pricing is reasonable if
the free tier doesn't work for you.

#### Sign up
Go to the [openode.io website](https://openode.io) and sign up.

#### Create a new instance for your app
1. On the website, click on [My Instances](https://www.openode.io/admin/). This
page lists your existing apps (called "instances" here), and allows you to create
new ones.

2. Below Instances, click on [Add new](https://www.openode.io/admin/new).

3. Give your instance a subdomain and click the Create button. The subdomain is the name
of your app, and also part of your app's URL (where AltspaceVR will connect later).

You now have an instance where you can deploy your app! The next page you see
contains step-by-step deployment instructions using opeNode's command line interface (CLI).
This same process is outlined in the next section.

#### Deploy your app to your new instance
Note: A [video walkthrough](https://www.youtube.com/watch?v=SRzQOEwR4dM&list=PLmFHH6TuGBX1GjMAfzwz1wYz274RHq4ml&index=7&t=0s) is available to supplement the instructions below.
There is also a general MRE tutorial found [here](https://www.youtube.com/playlist?list=PLmFHH6TuGBX1GjMAfzwz1wYz274RHq4ml)

1. On your local machine, open a command prompt.
 
2. If needed, install the opeNode command line interface (only needs to be done once - this requires
the command prompt to be launched in administrator mode):
```
npm install -g openode
```
 
3. Change directory to your project:
    ```
    cd YOUR_PROJECT_DIRECTORY
    ```
4. Use the Dockerfile that comes with any of the sample MRE projects. A second option is you can create a Dockerfile using the openode CLI (only needs to be done once per project):
    ```
    openode template
    ```
    This creates a file on disk named `Dockerfile`. Make sure you change where it says `WORKDIR /opt/app` to `WORKDIR /opt/mre` or it will not be able to find /opt/app as a module. 
 
5. Edit the Dockerfile. You must add the line `ENV BASE_URL=http://YOUR_SITE_NAME.openode.io/` before you deploy or it won't be able to build. You can find your site name on the openode website. You also must add `ENV PORT=80` as it is not included in the samples Dockerfile though it is included in the one that is generated when you type openode template. 

    So add lines:

    ```
    ENV PORT=80
    ENV BASE_URL=http://YOUR_SITE_NAME.openode.io/
    ```

    after the `WORKDIR /opt/mre` line to your Dockerfile before you deploy.

    Save and close the Dockerfile.
 
6. Deploy your app
 
    To start a deployment, run this command:
    ```
    openode deploy
    ```
    This step copies your project to your opeNode instance, installs npm dependencies, and then starts it running.
    The first time you deploy your MRE SDK app, you may see an error message that starts with this:
    ```
    dtrace-provider@0.8.7 install /opt/app/node_modules/dtrace-provider
    > node-gyp rebuild || node suppress-error.js
 
    gyp ERR! configure error
    gyp ERR! stack Error: Can't find Python executable "python", you can set the PYTHON env variable.
    ```
    If you see this error, run `openode deploy` one more time and it should clear up. If you see this
    error again, please [open a GitHub issue here](https://github.com/Microsoft/mixed-reality-extension-sdk/issues/new).
 
Once your deployment succeeds, you're ready to connect from AltspaceVR! 
 
Open the AltspaceVR app, go to your world editor, press basics, then press SDK apps, then type wss://YOUR_SITE_NAME.openode.io/.
Note you must use wss:// or it will not connect. 
 
For instructions on instantiating your app within AltspaceVR, checkout the [sample repo's README.md](
https://github.com/Microsoft/mixed-reality-extension-sdk-samples/blob/master/README.md)
 
If you want to re-deploy, you should use `openode stop` before calling `openode deploy`, otherwise the deploy will 
fail. If a deploy fails, you can just call `openode deploy` again.


### Other Cloud Platforms

Have a hosting service recommendation? Please add it to this doc and submit a PR!

## Deploy to an Enterprise Grade Cloud Service

### Microsoft Azure

#### Sign up
Go to the [Azure website](https://azure.microsoft.com/en-us/free/)

#### Create a new application and deploy with VSCode 
1. Install and run [Visual Studio Code](https://code.visualstudio.com/)
2. Install VSCode extension 'Azure App Service'  [ms-azuretools.vscode-azureappservice](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice)
3. Open MRE folder in VSCode
4. Build your MRE application and verify locally
5. When you are ready to deploy, open Azure tab in VSCode and sign in with your Azure account
6. If you have an existing app, click Deploy to WebApp.. and pick the app name from the dropdown. Skip the next step
7. If deploying for the first time, create a new WebApp either in [Azure portal](https://portal.azure.com) or continue in VSCode (recommended):

* Right-click on your subscription and select Create New Web App.. (Advanced) and follow the steps
* choose a unique name for your new web app 
* Create a New Resource group or select an existing one (NOTE! This step creates resources on Azure)
* Linux or Windows: Linux
* Create a New Service plan, for example B1, or select an existing one

NOTE! Linux applications with WebSockets are not supported on Azure Free tier at this time. If your application is using F1 plan, you have to re-create all resources.
* pick Node.js 12 LTS runtime for your new Linux app
* choose Code instead of Docker container, if creating through Azure portal
* Wait until deployment completes (see Output window)
![AzureDeploySteps](https://user-images.githubusercontent.com/31327535/90576051-e5bacc80-e171-11ea-9bc0-e008387b375b.gif)

8. Configure the new web app in [Azure portal](https://portal.azure.com) to enable WebSockets:
* Go to App Services, find the app, go to Settings | Configuration | General settings and check WebSockets setting on.
9. Use wss://uniquewebappname.azurewebsites.net in MRETestBed or AltspaceVR to connect.


---
## Testing in AltspaceVR
Regardless of the deployment method you use, you will end up with a URL to the
deployed server. This is what the host app uses to connect to the MRE. Use that
URL with the [AltspaceVR testing instructions](
README.md#Testing-an-MRE-In-AltspaceVR),


## Inviting Friends in AltspaceVR
If your URL is publicly visible, you can invite friends into your AltspaceVR
homespace to see the MRE. On the Worlds page, on the Homespace tab, make sure
Allow Friends is checked. If you are in your homespace, your friends can click
on you in the friends tab, and click Go To, and they will enter to your
homespace.

Alternatively, you can create a party portal to bring friends in at the same
time. On the Discover page, under Top Picks For You, hover over the Homespace
icon and click Portal. Any user that clicks on the portal before you choose
launch will follow you into the homespace.
