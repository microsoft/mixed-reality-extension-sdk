/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import * as http from 'http';
import * as Restify from 'restify';
import App from './app';

process.on('uncaughtException', (error: Error) => {
    console.log("Uncaught exception:", error);
});

process.on('unhandledRejection', (reason: any, promise: Promise<void>) => {
    console.log("Unhandled rejection:", reason);
});

// Create a console logger for apps to use
const logger = new MRESDK.ConsoleLogger();
// logger.disable('debug', 'success');

// Base URL where we will serve static files
let baseUrl: string;

// If running ngrok, override BASE_URL for serving static assets
// process.env.BASE_URL = "https://17627c75.ngrok.io";

// Setup a handler for static file requests
function serveStaticFiles(server: http.Server) {
    const restify = server as Restify.Server;
    // The static files location
    baseUrl =
        process.env.BASE_URL ||
        (process.env.WEBSITE_HOSTNAME ?
            `//${process.env.WEBSITE_HOSTNAME}` :
            restify.url.replace(/\[::\]/, '127.0.0.1'));
    // Setup static files route
    restify.get('/*', Restify.plugins.serveStatic({
        directory: `${__dirname}/../public`,
        default: 'index.html'
    }));
}

// Create a Multi-peer adapter
const adapter = new MRESDK.MultipeerAdapter({ logger });

// Listen for new connections from a multi-peer client
adapter.listen().then((server) => serveStaticFiles(server));

// Handle new connections
adapter.onConnection((context, params) => new App(context, params, baseUrl));
