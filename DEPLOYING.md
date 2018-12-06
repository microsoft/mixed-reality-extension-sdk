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

## Deploy to a Free or Low-Cost Cloud Service

There are many free or low-cost cloud hosting services available. We list but a
few of them here.

### opeNode.io

[opeNode.io](https://www.openode.io/) offers a free starter plan that gets you
up and running quickly without having to provide a credit card. Deploying apps
is pretty simple using their command line tool. Pricing is very reasonable if
the free tier doesn't work for you.

#### Sign up
Go to the [openode.io website](https://openode.io) and sign up. Be sure to
verify your email. opeNode will not run your app until this step is complete.

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
1. On your local machine, open a command prompt.

2. If needed, install the opeNode command line interface (only needs to be done once):
```
npm install -g openode
```

3. Change directory to your project:
```
cd YOUR_PROJECT_DIRECTORY
```

4. If needed, create a Dockerfile using the openode CLI (only needs to be done once per project):
```
openode template
```
This creates a file on disk named `Dockerfile`

5. Edit the Dockerfile

The Node version specified in the Dockerfile is newer than the MRE SDK's Node depencency. To eliminate
potential incompatibility, edit the first line of the Dockerfile so that it specifies Node v8.12:
```
FROM node:8.12
```

Your app can be bundled with static files located in the `public` folder. These files include glTF
models, audio resources, etc. For the app to be able to serve these files to the client, it needs to
know the URL where it is running. The best way to get this URL is to first deploy to your instance
*without* this setting in your Dockerfile, then come back, add the setting, and redeploy.

After your app deploys you will see a message that looks like this:
```js
[ { result: 'success',
    URL: 'http://YOUR_SITE_NAME.fr.openode.io/' } ]
```

Copy the `URL` value, edit your Dockerfile and add this line just below the line that reads `ENV PORT=80`:
```
ENV BASE_URL=//YOUR_SITE_NAME.fr.openode.io
```
(Notice that `http:` was removed from the front of the value)

Save and close the Dockerfile.

5. Deploy your app

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

Once your deployment succeeds, you're ready to connect from AltspaceVR! For instructions
on instantiating your app within AltspaceVR, checkout the [sample repo's README.md](
https://github.com/Microsoft/mixed-reality-extension-sdk-samples/blob/master/README.md)

### Other Cloud Platforms

Have a hosting service recommendation? Please add it to this doc and submit a PR!

## Deploy to an Enterprise Grade Cloud Service

### Microsoft Azure

Coming Soon.


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
