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
import PrimitivesTest from './primitives-test';
import ReparentTest from './reparent-test';
import RigidBodyTest from './rigid-body-test';
import TextTest from './text-test';
import UserTest from './user-test';

type FactoryMap = { [key: string]: TestFactory };

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
    'primitives-test': (...args) => new PrimitivesTest(...args),
    'reparent-test': (...args) => new ReparentTest(...args),
    'rigid-body-test': (...args) => new RigidBodyTest(...args),
    'text-test': (...args) => new TextTest(...args),
    'user-test': (...args) => new UserTest(...args),
} as FactoryMap;

export const TestNames = Object.keys(Factories).sort();

export interface MenuItem {
    label: string;
    action: TestFactory | MenuItem[];
}

const branchFactor = 5;
function paginate(tests: FactoryMap): MenuItem[] {
    const names = Object.keys(tests).sort();
    const count = names.length;
    if (count <= branchFactor) {
        return names.map(name => ({ label: name, action: tests[name] } as MenuItem));
    } else {
        const submenus: MenuItem[] = [];

        while (names.length > 0) {
            const pageNames = names.splice(0, Math.ceil(count / branchFactor));
            submenus.push({
                label: pageNames[0].slice(0, 3) + " - " + pageNames[pageNames.length - 1].slice(0, 3),
                action: paginate(pageNames.reduce(
                    (sum, val) => { sum[val] = tests[val]; return sum; },
                    {} as FactoryMap
                ))
            });
        }

        return submenus;
    }
}

export const Menu = paginate(Factories);
