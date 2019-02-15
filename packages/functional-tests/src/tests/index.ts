/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TestFactory } from '../test';

import AltspaceVRLibraryTest from './altspacevr-library-test';
/*import AltspaceVRVideoTest from './altspacevr-video-test';
import AssetEarlyAssignmentTest from './asset-early-assignment-test';
import AssetMutabilityTest from './asset-mutability-test';
import AssetPreloadTest from './asset-preload-test';
import ClockSyncTest from './clock-sync-test';
import GltfAnimationTest from './gltf-animation-test';
import GltfConcurrencyTest from './gltf-concurrency-test';
import GltfGenTest from './gltf-gen-test';
import InputTest from './input-test';
import InterpolationTest from './interpolation-test';
import LightTest from './light-test';
import LookAtTest from './look-at-test';
import PrimitivesTest from './primitives-test';
import ReparentTest from './reparent-test';
import RigidBodyTest from './rigid-body-test';
import TextTest from './text-test';
import UserTest from './user-test';*/

/**
 * Registry of functional tests. Add your test here.
 * *** KEEP LIST SORTED ***
 */
export default {
    'altspacevr-library-test': (...args) => new AltspaceVRLibraryTest(...args),
    /*'altspacevr-video-test': (): Test => new AltspaceVRVideoTest(this, this.baseUrl),
    'asset-early-assignment-test': (): Test => new AssetEarlyAssignmentTest(this, this.baseUrl),
    'asset-mutability-test': (user: MRESDK.User): Test => new AssetMutabilityTest(this, this.baseUrl, user),
    'asset-preload-test': (user: MRESDK.User): Test => new AssetPreloadTest(this, this.baseUrl, user),
    'clock-sync-test': (): Test => new ClockSyncTest(this, this.baseUrl),
    'gltf-animation-test': (): Test => new GltfAnimationTest(this, this.baseUrl),
    'gltf-concurrency-test': (): Test => new GltfConcurrencyTest(this, this.baseUrl),
    'gltf-gen-test': (): Test => new GltfGenTest(this, this.baseUrl),
    'input-test': (): Test => new InputTest(this, this.baseUrl),
    'interpolation-test': (): Test => new InterpolationTest(this),
    'light-test': (): Test => new LightTest(this, this.baseUrl),
    'look-at-test': (user: MRESDK.User): Test => new LookAtTest(this, this.baseUrl, user),
    'primitives-test': (): Test => new PrimitivesTest(this, this.baseUrl),
    'reparent-test': (): Test => new ReparentTest(this),
    'rigid-body-test': (): Test => new RigidBodyTest(this),
    'text-test': (): Test => new TextTest(this),
    'user-test': (user: MRESDK.User): Test => new UserTest(this, this.baseUrl, user),*/
} as {[key: string]: TestFactory};
