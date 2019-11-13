/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Installs "watchers" for leaf properties in the target object, and calls the supplied callback
 * when they change and passing the entire path to the leaf, e.g.: ["transform", "position", "z"]
 */
export function observe(options: {
	target: any,
	targetName: string,
	notifyChanged: (...path: string[]) => void,
	triggerNotificationsNow?: boolean
}) {
	observeLeafProperties(options.target, [options.targetName], options.notifyChanged, options.triggerNotificationsNow);
}

/**
 * @hidden
 * Uninstalls "watchers" for leaf properties in the target object, and removes the attached callbacks from
 * the target object.
 * @param target The target object to unobserve.
 */
export function unobserve(target: any) {
	unobserveLeafProperties(target);
}

function observeLeafProperties(
	target: any, path: string[], notifyChanged: (...path: string[]) => void, triggerNotificationsNow: boolean) {
	const names = Object.getOwnPropertyNames(target)
		.filter(n => !target.$DoNotObserve || !target.$DoNotObserve.includes(n));
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
		const publicName = name.replace(/^_+/u, '');
		// If the property is a simple type, then hook it.
		const type = typeof target[name];
		if (type === 'number' || type === 'string' || type === 'boolean') {
			// Create a non-enumerable backing property to hold the field value.
			const __name = `__observed_${name}`;
			Object.defineProperty(target, __name, {
				configurable: true,
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

function unobserveLeafProperties(target: any) {
	const names = Object.getOwnPropertyNames(target)
		.filter(n => !target.$DoNotObserve || !target.$DoNotObserve.includes(n));
	for (const name of names) {
		// Fields starting with a dollar sign are not observed.
		// Fields that don't begin with '__observe_' are not hooked up for being observed.
		if (name.startsWith('$') || !name.startsWith('__observed_')) {
			continue;
		}
		// TODO: Figure out array patching.
		if (Array.isArray(target[name])) {
			continue;
		}

		// Get the original name of this field by removing the prefixed '__observed_'.
		const originalName = name.replace(/^__observed_/u, '');
		// If the property is a simple type, then un-hook it.
		const type = typeof target[name];
		if (type === 'number' || type === 'string' || type === 'boolean') {
			// Create the original property with the current value.\
			Object.defineProperty(target, originalName, {
				configurable: true,
				enumerable: true,
				value: target[name],
				writable: true
			});

			// Remove the internal observer property that was hooked to the observer system.
			delete target[name];
		} else if (type === 'object') {
			unobserveLeafProperties(target[name]);
		}
	}
}
