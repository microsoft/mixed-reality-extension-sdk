# Functional Tests

## Actor Attachment



Description:
*  "Actors attaching to avatar points"

How to Run:
* On start, a grey, oblong box attaches to the avatar of the user who started the test
* The current attachment point is displayed above the grey box in the center of the test setup
* Clicking the grey box changes the avatar attachment point
* Clicking the box on the left changes the attachment strategy:
	* When the box is Red, the attachment box is destroyed, then a new one is created and attached to the new point
	* When the box is Blue, the attachment box is re-parented to a new attachment point without being destroyed

Pass when: 
* The attachment box is attached with its center directly over the body part displayed in text for every combination of settings

Fail when: 
* Any combination of settings yields an incorrect transformation

Notes:
* Selfie camera or a friend is necessary for verifying some of these locations

*As of 07/08, Reparenting the box instead of re-creating it yields the incorrect transformation*