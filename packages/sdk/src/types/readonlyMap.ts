/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export default interface ReadonlyMap<K,V> {
	entries(): IterableIterator<[K,V]>;
	forEach(callbackFn: (value: V, key: K, map: ReadonlyMap<K,V>) => void, thisArg?: any): void;
	get(key: K): V;
	has(key: K): boolean;
	keys(): IterableIterator<K>;
	values(): IterableIterator<V>;
	size: number;
}
