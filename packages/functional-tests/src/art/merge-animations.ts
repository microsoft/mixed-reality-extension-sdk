/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import GLTF from '@microsoft/gltf-gen/built/gen/gltf';
import { promisify } from 'util';
import { resolve, dirname } from 'path';
import { readFile as _readFile, writeFile as _writeFile, unlink as _unlink } from 'fs';
const readFile = promisify(_readFile),
	writeFile = promisify(_writeFile),
	unlink = promisify(_unlink);

async function convertToDataUrl(filename: string): Promise<string> {
	const data = await readFile(filename);
	return 'data:application/octet-stream;base64,' + data.toString('base64');
}

/**
 * Load a glTF file, and merge all contained animations into one.
 */
async function main(args: string[]) {
	const filename = resolve(process.cwd(), args[args.length - 1]);
	let gltf: GLTF.GlTf;
	try {
		// load the original json
		const text = await readFile(filename, { encoding: 'utf8' });
		// parse as glTF
		gltf = JSON.parse(text) as GLTF.GlTf;
	} catch (e) {
		console.error(`Could not parse glTF JSON from ${filename}`);
		process.exit(1);
	}

	// verify existence of animations
	const anims = gltf.animations;
	console.log(`glTF has ${anims?.length} animations`);
	if (!anims || anims.length === 0) { return; }

	// rewrite animations
	const final = { channels: [], samplers: [] } as GLTF.Animation;
	for (const anim of anims) {
		const samplerOffset = final.samplers.length;
		final.samplers.push(...anim.samplers);
		for (const channel of anim.channels) {
			channel.sampler += samplerOffset;
			final.channels.push(channel);
		}
	}
	gltf.animations = [ final ];

	// pack binary into json
	const binFile = resolve(dirname(filename), gltf.buffers[0].uri);
	gltf.buffers[0].uri = await convertToDataUrl(binFile);
	await unlink(binFile);

	// write result back to file
	await writeFile(filename, JSON.stringify(gltf));
	console.log('Done');
}

main(process.argv);
