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

/**
 * The page tree is optimized for:
 * 1. Minimizing the number of clicks to run the hardest-to-reach test
 * 2. Minimizing the number of pages
 * 3. Spreading tests evenly across pages
 *
 * The general pagination algorithm is as follows:
 * 1. Determine the minimum depth of the balanced decision tree (n).
 * 2. Compute the max capacity of a full tree at said depth.
 * 3. Redistribute overflow (tests minus capacity) so that no bucket contains more than b^(n+1) tests
 */
export function paginate(tests: FactoryMap, pageSize: number, names: string[] = null): MenuItem[] {
	if (names === null) {
		names = Object.keys(tests).sort();
	}
	if (names.length <= pageSize) {
		return names.map(n => { return { label: n, action: tests[n] } as MenuItem; });
	}

	const avgDepth = Math.log(names.length) / Math.log(pageSize) - 1;
	const lowDepth = Math.floor(avgDepth), highDepth = Math.ceil(avgDepth);
	const lowBucketSize = Math.pow(pageSize, lowDepth), highBucketSize = Math.pow(pageSize, highDepth);
	let overflowFromMaxLow = names.length - pageSize * lowBucketSize;

	const buckets: MenuItem[] = [];
	let lastBucketsLastTestName = '';
	while (names.length > 0) {
		const extraCount = Math.min(highBucketSize - lowBucketSize, overflowFromMaxLow);
		overflowFromMaxLow -= extraCount;

		const subpageNames = names.splice(0, lowBucketSize + extraCount);
		const lastSubpageTestName = subpageNames[subpageNames.length - 1];
		const subpage = paginate(tests, pageSize, [...subpageNames]);
		if (subpage.length === 1) {
			buckets.push(subpage[0]);
		} else if (subpage.length > 1) {
			buckets.push({
				label: uniquePrefix(subpageNames[0], lastBucketsLastTestName) + ' - '
					+ uniquePrefix(lastSubpageTestName, names[0] || ''),
				action: subpage
			});
		}
		lastBucketsLastTestName = lastSubpageTestName;
	}

	return buckets;
}
