/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { resolve as resolvePath } from 'path';
import { App } from './app';

process.on('uncaughtException', (err) => console.log('uncaughtException', err));
process.on('unhandledRejection', (reason) => console.log('unhandledRejection', reason));

MRE.log.enable('app');
// MRE.log.enable('network');
// MRE.log.enable('network-content');

// Start listening for connections, and serve static files
const server = new MRE.WebHost({
    // baseUrl: 'http://<ngrok-id>.ngrok.io',
    baseDir: resolvePath(__dirname, '../public'),
});

// Handle new application sessions
server.adapter.onConnection((context, params) => new App(context, params, server.baseUrl));

export default server;
