# MRE SDK Workflow and Branching Guide

## Motivation for branch system revision
* minimize the number of custom branch names and purposes, to 3 branches for all non-hotfix commits (2 in SDK, 1 in Unity)
* remove unnecessary overhead caused by matching AltspaceVR branch changes and releases
* create a consistent hotfix strategy

## Branches
* */red and */green = active development. 
* unity/r0.[minor].n, SDK/r0.[minor].n = release branches – new branches are created when a new release is initiated (not just when we are ready to publish the DLLs/NPM packages)
* unity/master and sdk/master = branch pointers to minimum supported DLL (typically AltspaceVR's shipped version) and recommended SDK. This is not used for MRE development, and nothing is ever committed to the master branches directly.

Unity, SDK, and Sample repos all have matching branch names (except there is no unity/green – non-breaking features go into the red branch). Samples repo changes are integrated similar to the SDK repo changes. 

<img width='936' height='827' src='branding/Branches.png'/>

## Recommended branch usage
* use unity/master+sdk/master (or sdk/green) for quick tests/debugging released MREs.
* use unity/master(or altspacevr retail build)+sdk/green for minor node fixes/hotfixes
* use unity/red+sdk/red for general development.

## Misc. Notes

(Once we guarantee back compatibility, Unity/master should point to the newest releases sdk, and sdk/master should point to minimum supported version - we want implementers to use the freshest dll, but MRE creators to make MREs that run on every host app). But due to back compat, for now unity/master will point to a version compatible with sdk/master

Minimum supported version=the major.minor version that all host apps support, and have force updated their users to.

Minor version number doesn't *have* to increment in lockstep with altspace's release cycle. We may do more than 1 sdk release between altspace releases.

With this structure, I'd expect there to mostly be 1 or 2 active release versions, but occasionally there would be 3 (or in theory more). The diagram cover 3 active versions for comprehension

(* indicates a detailed workflow below)

## Main workflows:
###	[Orange] Integrate minor unity-only change
1.	Develop feature* targeting unity/red

###	[Green] integrate node-only change (or hotfix)
1.	Develop feature* targeting sdk/green, samples/green

###	[Red] integrate breaking unity+node change
1.	Develop feature* targeting unity/red, sdk/red, samples/red

###	 [Blue] When we decide to prepare a new MRE minor version release (criteria: usually ~1 day before Altspace code lock, or sooner if there are major changes)
1.	Merge sdk/green into sdk/red
2.	Merge samples/green into samples/red
3.	Make sure protocol version is incremented in red branches if needed:
	a.	MREUnityRuntimeLib\Constants.cs: ProtocolVersion
	b.	packages\sdk\src\utils\verifyClient.ts: CurrentProtocolVersion
	c.	**TODO: We should change to have both current and min protocol versions. Unity rejects if MRE currentprotocolversion is higher than unity.Current or older than unity.min, and MRE rejects only if Unity.current is older than min (because newer clients are compatible with  older MREs)**
4.	Test pass* for red branches
5.	Create new unity/sdk/sample branches named v0.[new_minor].n, matching the red (NOTE: if there was already a new SDK release created, but it wasn't "shipped", we can stomp that - i.e. if v0.[new_minor-1].n was never used in any host app, we can just reset hard, instead of creating v0.[new_minor].n)
6.	Build Unity DLLs* from unity/v0.[new_minor].n
7.	Publish NPM package* from sdk/v0.[new_minor].n tagged @next

###	[Cyan] When we decide to integrate sdk/green into an existing minor release (criteria: whenever we think it's worth the effort)
1.	Merge sdk/green into sdk/v0.[target].n 
2.	Merge samples/green into samples/v0.[ target].n 
3.	Test Pass* for v0.[ target].n branches
4.	If target is current master version
	a.	Publish NPM package* from v0.[ target].n tagged @latest 
	b.	Update Master branches* for sdk/samples
5.	If target is not master version
	a.	Publish NPM package* from v0.[ target].n tagged @next
6.	If branches for (target +1) exists
	a.	Merge sdk/v0.[ target].n into sdk/v0.[ target +1].n 
	b.	Merge samples/v0.[ target].n into samples/v0.[ target +1].n 
	c.	Repeat steps 3-6 with target = target +1
7.	Merge sdk/green into sdk/red
8.	Merge samples/green into samples/red
9.	Test pass* for red branches

###	[Purple] When we need to do a unity-side hotfix in any target release
1.	Develop hotfix* targeting the unity/v0.[target].n branch. 
2.	Build Unity DLLs* from unity/r0.[target].n
3.	If target is current master version
	a.	Update master branches* for Unity
4.	If branches for (targetversion+1) exists
	a.	Cherry pick hotfix from unity/r0.[target].n to unity/r0.[targetversion+1].n, 
	b.	Repeat steps 2-3 with target=target+1
5.	Merge cherry pick hotfix to unity/red
6.	Test pass* for red branches

###	[Black] When we update the minimum supported version (i.e. just after Altspace releases)

1.	Re-tag the latest NPM package from sdk/v0.[new_minor].n with @latest instead of @next
	a.	npm dist-tag add <pkg> @latest
	b.	npm dist-tag rm <pkg> @next
2.	Update Master Branches* for all repositories
3. 	Merge sdk/v0.[new_minor].n to sdk/green
4.	Merge samples/v0.[new_minor].n to samples/green
5.	Test pass* for green branches

### When Altspace creates RC
1.	Do nothing – MRE release cycle is decoupled from Altspace RC cycle.
 
## Detailed Workflows

### Develop Feature/Develop Hotfix
1.	Create Branch [username]/[featurename] (or feature/[featurename], bug/[bugname] or hotfix/[hotfixname] from a target branch, for all relevant repos (SDK/user/samples)
2.	Write code, commit to branch, push up
3.	Ensure your feature has test coverage in the functional-test app, and add if necessary
4.	Test pass* for the branch
5.	Do PR towards target branch, with nice description.
6.	If failure or revisions, go to step 2
7.	When PR is approved for all relevant repos (SDK/User/Samples), do the PR squash merge for all repos simultaneously.

### Test Pass
1.	Main purpose of test pass is to look for regressions – not if new features work properly.
2.	**<Is this thorough enough?>**
3.	Run all functional tests.
	a.	Test localhost deploy functional tests
		i.	Run functional test scene in unity test bed
		ii.	using the functional test menu in synchronization scene in testbed. Go in and out of each test twice. Keep an eye on the synchronized instance and make sure both work
4.	Deploy functional test temporarily to openode/Heroku/azure/ngrok and test 
5.	Verify functional tests runs on Android.
6.	Run all samples
	a.	**TODO: insert link to instructions for running with local NPM package instead of public**
7.	If problems are found, fix and restart test pass

### Publish NPM Packages
1.	Note that we always publish all packages with each release, with version numbers in sync
2.	Check out sdk\v1.[minor].n 
3.	Git reset –hard
4.	git clean -fdx
5.	npm install
6.	npm run build
7.	lerna publish –dist-tag <either next or latest>
	a.	when it asks for version number, use 0.[minor].[patch], where minor comes from branch, and patch version is 1+the last published NPM package for that minor version (to find last published version see https://www.npmjs.com/package/@microsoft/mixed-reality-extension-sdk?activeTab=versions)
8.	For each updated package.json version number, notepad-update the version number in every corresponding package-lock.json in both sdk and samples repo. Lerna doesn’t do this (but should).
9.	Git commit package.json and package-lock.json changes to sdk\v1.[minor].n
10.	npm run build-docs (to regenerate documentation)
11.	commit documentation changes to sdk\v1.[minor].n
12.	in samples\v1.[minor].n, for each of the samples update the patch version:
a.	npm update @microsoft/mixed-reality-extension-sdk@0.[minor].[patch]
b.	npm install
c.	npm run build
d.	verify it loads
e.	git commit package.json and package-lock.json changes to samples\v1.[minor].n

### Update Master Branches
1.	Publish docs from that branch to ??? github pages
2.	Gather the differences from each repo (to see what we have added): git log --oneline origin/master..origin/unity/v0.[minor].n
3.	git reset hard unity/master to unity/v0.[minor].n
4.	git reset hard sdk/master to sdk/v0.[minor].n
5.	git reset hard samples/master to samples/v0.[minor].n
6.	redeploy samples and functional test MREs
7.	Slack: Make announcement to #announcements channel, share announcement on #general channel.
8.	Twitter: Announce new features
9.	Teams: announce on Altspace Community Support->SDK or General

### Build Unity DLLs
1.	It builds on server at every commit 
2.	**go to https://microsoft.visualstudio.com/Analog/_build?definitionId=31240 and find build matching the commit ID**
3.	**Permanently store it with version number at?????**
4.	If minor version matches altspaceVR dev or RC branch’s current minor version, or if update is desired then updating AltspaceVR DLLs:
	a.	Copy all the following files from MRE build server’s artifacts to Altspace’s Assets\Plugins folder:
		1.	Newtonsoft.Json.xml
		2.	Newtonsoft.Json.dll
		3.	GLTFSerialization.dll
		4.	UnityGLTF.dll
		5.	MREUnityRuntimeLib.dll
	b.	Update Altspace’s Assets\Plugins\AAA-References.md (info about newtonsoft and unitygltf can be found in the MRE build server’s artifacts’ libraries.md
	c.	Run through all functional tests in 2 user mode **todo: set up an SDK test space**
	d.	Verify on android as one of the two users.

### Update UnityGLTF DLL
1.	This change should be treated like all other unity-only changes, just make sure to
	a.	Sync https://github.com/KhronosGroup/UnityGLTF and build it by doing **???**
	b.	Copy all the following files to \MREUnityRuntime\Libraries
		i.	UnityGLTF.dll
		ii.	UnityGLTF.pdb
		iii.	GLTFSerialization.dll
		iv.	GLTFSerialization.pdb
	c.	Update \MREUnityRuntime\Libraries\libraries.md

### Update NewtonSoft.JSON DLL
1.	This change should be treated like all other unity-only changes, just make sure to
	a.	Sync https://github.com/AltspaceVR/Newtonsoft.Json (note there is a commit added to disable dynamic code generation – 
	b.	Rebase this repo’s master branch on top of the base newtonsoft repo’s master branch (there are 1-2 commits there – they could be squashed)
	c.	Follow build instructions in that repo’s ALTSPACE.md file (Ignore the part where ALTSPACE.md the instructions that say to copy dll/xml into altspace repository – that’s outdated and should be changed. By putting the dll/xml in MRE, it will automatically flow into Altspace with the next MRE DLL update)
	d.	Copy these “portable+net40+win8+wpa81+wp8+sl5” files to \MREUnityRuntime\Libraries
		i.	NewtonSoft.Json.dll
		ii.	NewtonSoft.Json.pdb
		iii.	NewtonSoft.Json.xml
	e.	Update \MREUnityRuntime\Libraries\libraries.md
2.	Be super careful to test Android after this, as that is pretty fragile.

