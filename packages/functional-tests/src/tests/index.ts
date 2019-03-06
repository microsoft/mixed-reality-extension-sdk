/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TestFactory } from '../test';

import AltspaceVRLibraryTest from './altspacevr-library-test';
import AltspaceVRVideoTest from './altspacevr-video-test';
import AssetEarlyAssignmentTest from './asset-early-assignment-test';
import AssetMutabilityTest from './asset-mutability-test';
import AssetPreloadTest from './asset-preload-test';
import ClockSyncTest from './clock-sync-test';
import FailureTest from './failure-test';
import GltfAnimationTest from './gltf-animation-test';
import GltfConcurrencyTest from './gltf-concurrency-test';
import GltfGenTest from './gltf-gen-test';
import InputTest from './input-test';
import InterpolationTest from './interpolation-test';
import LightTest from './light-test';
import LookAtTest from './look-at-test';
import PhysicsSimTest from './physics-sim-test';
import PrimitivesTest from './primitives-test';
import ReparentTest from './reparent-test';
// import RigidBodyTest from './rigid-body-test';
import SoundTest from './sound-test';
import TextTest from './text-test';
import UserTest from './user-test';
import VisibilityTest from './visibility-test';

export type FactoryMap = { [key: string]: TestFactory };

/**
 * Registry of functional tests. Add your test here.
 * *** KEEP LIST SORTED ***
 */
export const Factories = {
    'altspacevr-library-test': (...args) => new AltspaceVRLibraryTest(...args),
    'altspacevr-video-test': (...args) => new AltspaceVRVideoTest(...args),
    'asset-early-assignment-test': (...args) => new AssetEarlyAssignmentTest(...args),
    'asset-mutability-test': (...args) => new AssetMutabilityTest(...args),
    'asset-preload-test': (...args) => new AssetPreloadTest(...args),
    'clock-sync-test': (...args) => new ClockSyncTest(...args),
    'failure-test': (...args) => new FailureTest(...args),
    'gltf-animation-test': (...args) => new GltfAnimationTest(...args),
    'gltf-concurrency-test': (...args) => new GltfConcurrencyTest(...args),
    'gltf-gen-test': (...args) => new GltfGenTest(...args),
    'input-test': (...args) => new InputTest(...args),
    'interpolation-test': (...args) => new InterpolationTest(...args),
    'light-test': (...args) => new LightTest(...args),
    'look-at-test': (...args) => new LookAtTest(...args),
    'physics-sim-test': (...args) => new PhysicsSimTest(...args),
    'primitives-test': (...args) => new PrimitivesTest(...args),
    'reparent-test': (...args) => new ReparentTest(...args),
    // 'rigid-body-test': (...args) => new RigidBodyTest(...args),
    'sound-test': (...args) => new SoundTest(...args),
    'text-test': (...args) => new TextTest(...args),
    'user-test': (...args) => new UserTest(...args),
    'visibility-test': (...args) => new VisibilityTest(...args),
} as FactoryMap;
