/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { readFile as readFileNodeAsync } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
const readFile = promisify(readFileNodeAsync);

import safeAccessPath from './safeAccessPath';

/* eslint-disable no-console */

interface LogEvent {
	input: string;
	timestamp: Date;
	client: string;
	direction?: 'to' | 'from';
	networkContents?: any;
}

async function main(filename: string) {
	const events = await parseFile(filename);
	for (const evt of events.filter(e => !/heartbeat/u.test(safeAccessPath(e, 'networkContents', 'payload', 'type')))) {
		console.log(formatEvent(evt));
	}
}

async function parseFile(filename: string): Promise<LogEvent[]> {
	const fileContents = await readFile(resolve(process.cwd(), filename), { encoding: 'utf8' });
	const lines = fileContents.split('\n');
	const events = [] as LogEvent[];

	for (let i = 0; i < lines.length; i++) {
		if (!/\bnetwork-content\b/u.test(lines[i])) {
			continue;
		}

		const e = parseEvent(lines[i - 1], lines[i]);
		if (e !== null) {
			events.push(e);
		}
	}

	return events;
}

function parseEvent(network: string, contents: string): LogEvent {
	const e = {
		input: network + '\n' + contents,
		timestamp: new Date(network.split(' ', 2)[0]),
		client: '',
		networkContents: JSON.parse(contents.slice(contents.indexOf('{')))
	} as LogEvent;

	const matches = /\bclient ([0-9a-f]{8})\b/u.exec(network);
	if (matches !== null) {
		e.client = matches[1];
	} else if (/\bSession/u.test(network)) {
		e.client = 'session';
	} else {
		return null;
	}

	if (/\brecv\b/u.test(network)) {
		e.direction = 'from';
	} else if (/\bsend\b/u.test(network)) {
		e.direction = 'to';
	}

	return e;
}

const columns = ['session'];
const colWidth = 30;
function formatEvent(event: LogEvent): string {
	if (!columns.includes(event.client)) {
		columns.push(event.client);
	}

	const props = {
		time: event.timestamp.toLocaleTimeString('en-US', { hour12: false }),
		messageId: (safeAccessPath(event, 'networkContents', 'id') || '').slice(0, 6),
		replyToId: (safeAccessPath(event, 'networkContents', 'replyToId') || '').slice(0, 6),
		payloadType: safeAccessPath(event, 'networkContents', 'payload', 'type'),
		name: safeAccessPath(event, 'networkContents', 'payload', 'definition', 'name') as string
			|| safeAccessPath(event, 'networkContents', 'payload', 'actor', 'name') as string
			|| ''
	};

	if (event.client === 'session') {
		const dir = event.direction === 'to' ? '<=' : '=>';
		return `${props.time} (${props.messageId}) ${props.payloadType} ${props.name}${dir} ${props.replyToId}`;
	} else {
		const replyTo = props.replyToId ? `(${props.replyToId}) ` : '';
		const indentation = ' '.repeat(-replyTo.length + colWidth * columns.indexOf(event.client));
		const dir = event.direction === 'from' ? '<=' : '=>';
		return `${props.time} ${indentation}${replyTo}${dir} (${props.messageId}) ${props.payloadType} ${props.name}`;
	}
}

main(process.argv[2] || null).catch(e => console.error(e));
