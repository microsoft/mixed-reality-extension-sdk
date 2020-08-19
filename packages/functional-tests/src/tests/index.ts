/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TestFactory } from '../test';

import ActorAttachmentTest from './actor-attachment-test';
import ActorSpamTest from './actor-spam-test';
import AltspaceVRLibraryTest from './altspacevr-library-test';
import AltspaceVRUserFilterTest from './altspacevr-user-filter-test';
import AltspaceVRVideoTest from './altspacevr-video-test';
import AnimationBlendTest from './animation-blend-test';
import AnimationDynamicTest from './animation-dynamic-test';
import AnimationRelativeTest from './animation-relative-test';
import AnimationScaleTest from './animation-scale-test';
import AnimationSyncTest from './animation-sync-test';
import AnimationToTest from './animation-to-test';
import AssetEarlyAssignmentTest from './asset-early-assignment-test';
import AssetMutabilityTest from './asset-mutability-test';
import AssetPreloadTest from './asset-preload-test';
import AssetUnloadTest from './asset-unload-test';
import ButtonTargetingTest from './button-targeting-test';
import ClockSyncTest from './clock-sync-test';
import CollisionLayerTest from './collision-layer-test';
import FailureTest from './failure-test';
import FontTest from './font-test';
import GltfActorSyncTest from './gltf-actor-sync-test';
import GltfConcurrencyTest from './gltf-concurrency-test';
import GltfGenTest from './gltf-gen-test';
import GrabTest from './grab-test';
import GridTest from './grid-test';
import InputTest from './input-test';
import LibraryFailTest from './library-fail-test';
import LightTest from './light-test';
import LookAtTest from './look-at-test';
import LivestreamTest from './livestream-test'
import PhysicsBounceTest from './physics-bounce-test';
import PhysicsExclusiveTest from './physics-exclusive';
import PhysicsStackTest from './physics-stack-test';
import PhysicsFrictionTest from './physics-friction-test';
import PhysicsSimTest from './physics-sim-test';
import PhysicsCollisionTest from './physics-collision'
import PhysichFreeFallTest from './physics-free-fall'
import PhysicsHeadCollisionTest from './physics-head-collision'
import PhysicsDynamicVsKinematicTest from './physics-dynamic-and-kinematic'
import PhysicsPileTest from './physics-pile-test'
import PrimitivesTest from './primitives-test';
import PromptTest from './prompt-test';
import ReparentTest from './reparent-test';
import SoundTest from './sound-test';
import SoundSyncTest from './sound-sync-test';
import StatsTest from './stats-test';
import TextTest from './text-test';
import TransformTest from './transform-test';
import UserMaskTest from './user-mask-test';
import UserTest from './user-test';
import VideoTest from './video-test';
import VideoSyncTest from './video-sync-test';
import VisibilityTest from './visibility-test';

export type FactoryMap = { [key: string]: TestFactory };

/**
 * Registry of functional tests. Add your test here.
 * *** KEEP LIST SORTED ***
 */
export const Factories = {
	'actor-attachment': (...args) => new ActorAttachmentTest(...args),
	'actor-spam': (...args) => new ActorSpamTest(...args),
	'altspacevr-library': (...args) => new AltspaceVRLibraryTest(...args),
	'altspacevr-user-filter': (...args) => new AltspaceVRUserFilterTest(...args),
	'altspacevr-video': (...args) => new AltspaceVRVideoTest(...args),
	'animation-blend': (...args) => new AnimationBlendTest(...args),
	'animation-dynamic': (...args) => new AnimationDynamicTest(...args),
	'animation-relative': (...args) => new AnimationRelativeTest(...args),
	'animation-scale': (...args) => new AnimationScaleTest(...args),
	'animation-sync': (...args) => new AnimationSyncTest(...args),
	'animation-to': (...args) => new AnimationToTest(...args),
	'asset-early-assignment': (...args) => new AssetEarlyAssignmentTest(...args),
	'asset-mutability': (...args) => new AssetMutabilityTest(...args),
	'asset-preload': (...args) => new AssetPreloadTest(...args),
	'asset-unload': (...args) => new AssetUnloadTest(...args),
	'button-targeting': (...args) => new ButtonTargetingTest(...args),
	'clock-sync': (...args) => new ClockSyncTest(...args),
	'collision-layer': (...args) => new CollisionLayerTest(...args),
	'failure': (...args) => new FailureTest(...args),
	'font': (...args) => new FontTest(...args),
	'gltf-actor-sync': (...args) => new GltfActorSyncTest(...args),
	'gltf-concurrency': (...args) => new GltfConcurrencyTest(...args),
	'gltf-gen': (...args) => new GltfGenTest(...args),
	'grab': (...args) => new GrabTest(...args),
	'grid': (...args) => new GridTest(...args),
	'input': (...args) => new InputTest(...args),
	'library-fail': (...args) => new LibraryFailTest(...args),
	'light': (...args) => new LightTest(...args),
	'livestream': (...args) => new LivestreamTest(...args),
	'look-at': (...args) => new LookAtTest(...args),
	'physics-bounce': (...args) => new PhysicsBounceTest(...args),
	'physics-friction': (...args) => new PhysicsFrictionTest(...args),
	'physics-free-fall': (...args) => new PhysichFreeFallTest(...args),
	'physics-shared-and-exclusive': (...args) => new PhysicsExclusiveTest(false, ...args),
	'physics-shared-and-exclusive-with-fixed-mass': (...args) => new PhysicsExclusiveTest(true, ...args),
	'physics-collision-b.0': (...args) => new PhysicsCollisionTest( 0, ...args),
	'physics-collision-b.8': (...args) => new PhysicsCollisionTest( 0.8,...args),
	'physics-head-collision-b.0': (...args) => new PhysicsHeadCollisionTest(0,...args),
	'physics-head-collision-b.2': (...args) => new PhysicsHeadCollisionTest(0.2,...args),
	'physics-pile-b.0v1': (...args) => new PhysicsPileTest(0, -1, 50, 0.0,...args),
	'physics-pile-b.0v2': (...args) => new PhysicsPileTest(0, 100000, 70, 0.0,...args),
	'physics-pile-b.0v3': (...args) => new PhysicsPileTest(0, -1, 50, 0.2,...args),
	'physics-sim': (...args) => new PhysicsSimTest(...args),
	'physics-stack': (...args) => new PhysicsStackTest(4, 0.5, false, false, ...args),
	'physics-stack-mix': (...args) => new PhysicsStackTest(4, 0.5, true, false, ...args),
	'physics-set-authority': (...args) => new PhysicsStackTest(4, 0.5, true, true, ...args),
	'physics-dynamic-vs-kinematic': (...args) => new PhysicsDynamicVsKinematicTest(...args),
	'primitives': (...args) => new PrimitivesTest(...args),
	'prompt': (...args) => new PromptTest(...args),
	'reparent': (...args) => new ReparentTest(...args),
	'sound': (...args) => new SoundTest(...args),
	'sound-sync': (...args) => new SoundSyncTest(...args),
	'stats': (...args) => new StatsTest(...args),
	'text': (...args) => new TextTest(...args),
	'transform': (...args) => new TransformTest(...args),
	'user-mask': (...args) => new UserMaskTest(...args),
	'user': (...args) => new UserTest(...args),
	'video': (...args) => new VideoTest(...args),
	'video-sync': (...args) => new VideoSyncTest(...args),
	'visibility': (...args) => new VisibilityTest(...args),
} as FactoryMap;
