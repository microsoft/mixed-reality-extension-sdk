/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import { log } from '@microsoft/mixed-reality-extension-sdk/built/log';
import { resolve as resolvePath } from 'path';
import App from './app';

// tslint:disable:no-console

process.on('uncaughtException', (err) => console.log('uncaughtException', err));
process.on('unhandledRejection', (reason) => console.log('unhandledRejection', reason));

log.enable(null, 'info');
log.enable('network', 'error');

// Start listening for connections, and serve static files
const server = new MRESDK.WebHost({
    baseDir: resolvePath(__dirname, '../public'),
});

// Handle new application sessions
server.adapter.onConnection((context, params) => new App(context, params, server.baseUrl));

export default server;
