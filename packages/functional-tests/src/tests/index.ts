/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TestFactory } from '../test';

import ActorSpamTest from './actor-spam-test';
import AltspaceVRLibraryTest from './altspacevr-library-test';
import AltspaceVRVideoTest from './altspacevr-video-test';
import AnimationNativeTest from './animation-native-test';
import AnimationScaleTest from './animation-scale-test';
import AssetEarlyAssignmentTest from './asset-early-assignment-test';
import AssetMutabilityTest from './asset-mutability-test';
import AssetPreloadTest from './asset-preload-test';
import AssetUnloadTest from './asset-unload-test';
import ClockSyncTest from './clock-sync-test';
import CollisionLayerTest from './collision-layer-test';
import FailureTest from './failure-test';
import GltfActorSyncTest from './gltf-actor-sync-test';
import GltfConcurrencyTest from './gltf-concurrency-test';
import GltfGenTest from './gltf-gen-test';
import GrabTest from './grab-test';
import GridTest from './grid-test';
import InputTest from './input-test';
import InterpolationTest from './interpolation-test';
import LibraryFailTest from './library-fail-test';
import LightTest from './light-test';
import LookAtTest from './look-at-test';
import PhysicsSimTest from './physics-sim-test';
import PrimitivesTest from './primitives-test';
import PromptTest from './prompt-test';
import ReparentTest from './reparent-test';
import SoundTest from './sound-test';
import StatsTest from './stats-test';
import TextTest from './text-test';
import TransformTest from './transform-test';
import UserMaskTest from './user-mask-test';
import UserTest from './user-test';
import VideoTest from './video-test';
import VisibilityTest from './visibility-test';

export type FactoryMap = { [key: string]: TestFactory };

/**
 * Registry of functional tests. Add your test here.
 * *** KEEP LIST SORTED ***
 */
export const Factories = {
	'actor-spam-test': (...args) => new ActorSpamTest(...args),
	'altspacevr-library-test': (...args) => new AltspaceVRLibraryTest(...args),
	'altspacevr-video-test': (...args) => new AltspaceVRVideoTest(...args),
	'animation-native-test': (...args) => new AnimationNativeTest(...args),
	'animation-scale-test': (...args) => new AnimationScaleTest(...args),
	'asset-early-assignment-test': (...args) => new AssetEarlyAssignmentTest(...args),
	'asset-mutability-test': (...args) => new AssetMutabilityTest(...args),
	'asset-preload-test': (...args) => new AssetPreloadTest(...args),
	'asset-unload-test': (...args) => new AssetUnloadTest(...args),
	'clock-sync-test': (...args) => new ClockSyncTest(...args),
	'collision-layer-test': (...args) => new CollisionLayerTest(...args),
	'failure-test': (...args) => new FailureTest(...args),
	'gltf-actor-sync-test': (...args) => new GltfActorSyncTest(...args),
	'gltf-concurrency-test': (...args) => new GltfConcurrencyTest(...args),
	'gltf-gen-test': (...args) => new GltfGenTest(...args),
	'grab-test': (...args) => new GrabTest(...args),
	'grid-test': (...args) => new GridTest(...args),
	'input-test': (...args) => new InputTest(...args),
	'interpolation-test': (...args) => new InterpolationTest(...args),
	'library-fail-test': (...args) => new LibraryFailTest(...args),
	'light-test': (...args) => new LightTest(...args),
	'look-at-test': (...args) => new LookAtTest(...args),
	'physics-sim-test': (...args) => new PhysicsSimTest(...args),
	'primitives-test': (...args) => new PrimitivesTest(...args),
	'prompt-test': (...args) => new PromptTest(...args),
	'reparent-test': (...args) => new ReparentTest(...args),
	'sound-test': (...args) => new SoundTest(...args),
	'stats-test': (...args) => new StatsTest(...args),
	'text-test': (...args) => new TextTest(...args),
	'transform-test': (...args) => new TransformTest(...args),
	'user-mask-test': (...args) => new UserMaskTest(...args),
	'user-test': (...args) => new UserTest(...args),
	'video-test': (...args) => new VideoTest(...args),
	'visibility-test': (...args) => new VisibilityTest(...args),
} as FactoryMap;
