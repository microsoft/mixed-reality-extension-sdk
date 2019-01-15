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
    for (const name of names) {
        // Only hook properties that don't start with an underscore or a dollar sign. This is a way for objects
        // to hide fields from being observed.
        if (name.startsWith('_') || name.startsWith('$')) {
            continue;
        }
        // If the property is a simple type, then hook it.
        const type = typeof target[name];
        if (type === 'number' || type === 'string' || type === 'boolean') {
            // Create a non-enumerable backing property to hold the field value. Setting the field non-enumerable
            // ensures the field won't be serialized in JSON.stringify().
            // tslint:disable-next-line:variable-name
            const __name = `__${name}`;
            Object.defineProperty(target, __name, {
                configurable: false,
                enumerable: false,
                value: target[name],
                writable: true
            });
            // Override the getter and setter to call notifyChanged when the value changes.
            Object.defineProperty(target, name, {
                configurable: true,
                enumerable: true,
                get: () => target[__name],
                set: (value) => {
                    if (target[__name] !== value) {
                        target[__name] = value;
                        notifyChanged(...path, name);
                    }
                },
            });
        } else if (type === 'object') {
            observeLeafProperties(target[name], [...path, name], notifyChanged);
        }
    }
}
