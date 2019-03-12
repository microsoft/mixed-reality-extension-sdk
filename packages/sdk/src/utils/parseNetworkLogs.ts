/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { readFile as readFileNodeAsync } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
const readFile = promisify(readFileNodeAsync);

import safeAccessPath from './safeAccessPath';

interface LogEvent {
    input: string;
    timestamp: number;
    client: string;
    direction?: 'to' | 'from';
    networkContents?: any;
}

async function main(filename: string) {
    const events = await parseFile(filename);
    for (let e of events.filter(e => !/heartbeat/.test(e.networkContents.payloadType))) {
        console.log(formatEvent(e));
    }
}

async function parseFile(filename: string): Promise<LogEvent[]> {
    const fileContents = await readFile(resolve(process.cwd(), filename), { encoding: 'utf8' });
    const lines = fileContents.split('\n');
    const events = [] as LogEvent[];

    for (let i = 0; i < lines.length; i++) {
        if (!/\bnetwork-content\b/.test(lines[i])) {
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
        timestamp: Date.parse(network.split(' ', 2)[0]),
        client: '',
        networkContents: JSON.parse(contents.slice(contents.indexOf('{')));
    } as LogEvent;

    let matches: string[];
    if (matches = /\bclient ([0-9a-f]{8})\b/.exec(network)) {
        e.client = matches[1];
    } else if (/\bSession/.test(network)) {
        e.client = 'session';
    } else {
        return null;
    }

    if (/\brecv\b/.test(network)) {
        e.direction = 'from';
    } else if (/\bsend\b/.test(network)) {
        e.direction = 'to';
    }

    return e;
}

var columns = ['session'];
const colWidth = 30;
function formatEvent(event: LogEvent): string {
    if (!columns.includes(event.client)) {
        columns.push(event.client);
    }

    const props = {
        messageId: event.networkContents.messageId.slice(0, 8),
        replyToId: (event.networkContents.replyToId || '').slice(0, 8),
        payloadType: event.networkContents.payloadType,
        assetName: safeAccessPath(event.networkContents, 'payload', 'definition', 'name') as string
    }

    if (event.client === 'session') {
        const dir = event.direction === 'to' ? '<=' : '=>';
        return `(${props.messageId}) ${props.payloadType} ${props.assetName}${dir} ${props.replyToId}`;
    } else {
        const replyTo = props.replyToId ? `(${props.replyToId}) ` : '';
        const indentation = ' '.repeat(-replyTo.length + colWidth * columns.indexOf(event.client));
        const dir = event.direction === 'from' ? '<=' : '=>';
        return `${indentation}${replyTo}${dir} (${props.messageId}) ${props.payloadType} ${props.assetName}`;
    }
}

main(process.argv[2] || null).catch(e => console.error(e));
