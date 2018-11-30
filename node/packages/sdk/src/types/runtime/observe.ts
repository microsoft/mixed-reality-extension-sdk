/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Installs "watchers" for leaf properties in the target object, and calls the supplied callback
 * when they change and passing the entire path to the leaf, e.g.: ["transform", "velocity", "z"]
 * Watchers are only installed for leaf properties whose name begins with a '_' character.
 */
export default function observe(target: any, targetName: string, notifyChanged: (...path: string[]) => void) {
    observeLeafProperties(target, [targetName], notifyChanged);
}

function observeLeafProperties(target: any, path: string[], notifyChanged: (...path: string[]) => void) {
    const names = Object.getOwnPropertyNames(target);
    for (let name of names) {
        // Only hook properties that start with an underscore.
        if (!name.startsWith('_')) {
            continue;
        }
        // Remove the leading underscore.
        name = name.slice(1);
        // If the property is a simple type, then hook it.
        const type = typeof target[`_${name}`];
        if (type === 'number' || type === 'string' || type === 'boolean') {
            // Override the setter to call notifyChanged.
            // TODO: Chain to existing property getter/setter. We're just
            // overwriting them here (not currently a problem).
            Object.defineProperty(target, name, {
                configurable: true,
                enumerable: true,
                get: () => target[`_${name}`],
                set: (value) => {
                    if (target[`_${name}`] !== value) {
                        target[`_${name}`] = value;
                        notifyChanged(...path, name);
                    }
                },
            });
        } else if (type === 'object') {
            observeLeafProperties(target[`_${name}`], [...path, name], notifyChanged);
        }
    }
}
