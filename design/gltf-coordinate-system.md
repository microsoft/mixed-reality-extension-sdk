Aligning to glTF's coordinate system would be a more consistent design for the SDK, given glTF's prominence in our API. But it could be a lot of work, and there are several approaches we could take. In this doc, I want to capture the scope of work and settle on a general approach.

### Actor properties
General treatment:
* Option 1: Convert to/from the host's coordinate system when reading/writing to host-native objects. For example, MREActor's transform on the host would remain in SDK coordinates, but applying that transform to, say, Unity's GameObject.transform is when the conversion would happen.
* Option 2: ...

#### Fields Affected
* Actor transforms
* Rigid body properties
* ...

### Loading of glTFs
General treatment:
* Option 1: The glTF loader should not convert the model to the host coordinate system or instantiate a host-native representation. Instead, it should pass the loaded data structure to the MRE runtime where it is instantiated in the SDK's coordinate system, converting to the host coordinate system when transforms, etc. are applied to the host-native objects.
* Option 2: ...
