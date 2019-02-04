/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Installs "watchers" for leaf properties in the target object, and calls the supplied callback
 * when they change and passing the entire path to the leaf, e.g.: ["transform", "position", "z"]
 */
export default function observe(options: {
    target: any,
    targetName: string,
    notifyChanged: (...path: string[]) => void,
    triggerNotificationsNow?: boolean
}) {
    observeLeafProperties(options.target, [options.targetName], options.notifyChanged, options.triggerNotificationsNow);
}

function observeLeafProperties(
    target: any, path: string[], notifyChanged: (...path: string[]) => void, triggerNotificationsNow: boolean) {
    const names = Object.getOwnPropertyNames(target);
    for (const name of names) {
        // Fields starting with a dollar sign are not observed.
        if (name.startsWith('$')) {
            continue;
        }
        // TODO: Figure out array patching.
        if (Array.isArray(target[name])) {
            continue;
        }
        // Get the public name of this field by removing leading underscores.
        const publicName = name.replace(/^_+/, '');
        // If the property is a simple type, then hook it.
        const type = typeof target[name];
        if (type === 'number' || type === 'string' || type === 'boolean') {
            // Create a non-enumerable backing property to hold the field value.
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
                configurable: false,
                enumerable: true,
                get: () => target[__name],
                set: (value) => {
                    if (target[__name] !== value) {
                        target[__name] = value;
                        notifyChanged(...path, publicName);
                    }
                },
            });
            if (triggerNotificationsNow) {
                notifyChanged(...path, publicName);
            }
        } else if (type === 'object') {
            observeLeafProperties(target[name], [...path, publicName], notifyChanged, triggerNotificationsNow);
        }
    }
}
