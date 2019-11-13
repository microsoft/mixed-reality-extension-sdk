/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MenuItem } from '../menu';
import { FactoryMap } from '../tests';

function uniquePrefix(of: string, against: string) {
	let prefixEnd = 0;

	while (of.charAt(prefixEnd) === against.charAt(prefixEnd)) {
		prefixEnd++;
	}

	return of.slice(0, prefixEnd + 1);
}

export function paginate(tests: FactoryMap, pageSize: number): MenuItem[] {
	const names = Object.keys(tests).sort();
	const count = names.length;
	if (count <= pageSize) {
		return names.map(name => ({ label: name, action: tests[name] } as MenuItem));
	} else {
		const submenus: MenuItem[] = [];
		let lastName = '';

		while (names.length > 0) {
			const pageNames = names.splice(0, Math.max(pageSize, Math.floor(count / (pageSize - 1))));
			const lastPageName = pageNames[pageNames.length - 1];
			submenus.push({
				label: uniquePrefix(pageNames[0], lastName) + " - " + uniquePrefix(lastPageName, names[0] || ''),
				action: paginate(pageNames.reduce(
					(sum, val) => { sum[val] = tests[val]; return sum; },
					{} as FactoryMap
				), pageSize)
			});

			lastName = lastPageName;
		}

		return submenus;
	}
}
