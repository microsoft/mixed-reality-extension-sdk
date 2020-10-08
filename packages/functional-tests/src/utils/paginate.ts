/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MenuItem } from '../menu';
import { FactoryMap } from '../tests';

export interface MenuNode {
	parent: MenuNode;
	menuItems: MenuItem[];
	currentPage: number;
}

export function populatePages(tests: FactoryMap, pageSize: number, parentNode: MenuNode = null): MenuNode {
	const buckets = {parent: parentNode, currentPage: 0, menuItems: new Array<MenuItem>()};
 
	for(const key in tests) {
		const val = tests[key];
		if(typeof val === 'function') {
			buckets.menuItems.push( {
				label: key,
				action: val
			})
		} else {
			buckets.menuItems.push( {
				label: key,
				action: populatePages(val, pageSize, buckets)
			});
		}
	}

	return buckets;
}
