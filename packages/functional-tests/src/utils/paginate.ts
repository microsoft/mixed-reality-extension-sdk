/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MenuItem } from '../menu';
import { FactoryMap } from '../tests';

/**
 * 
 * Format for nodes in the FactoryMap objects passed to the populatePages function
 * 
 */
export interface MenuNode {
	parent: MenuNode;
	menuItems: MenuItem[];
	currentPage: number;
}

/**
 * populatePages is a recursive function used to create the interactive menus for the functional test app
 * @param tests Map representing desired folder structure for tests
 * @param pageSize Maximum number of items per page
 * @param parentNode Optional parameter, parent of current node in the tree.
 * @returns A [[MenuNode]], the root of the menu tree at this level.
 * @hidden
 */
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
