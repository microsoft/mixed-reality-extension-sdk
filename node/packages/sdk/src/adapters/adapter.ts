/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Restify from 'restify';
import { Context, ParameterSet } from '..';
import BufferedEventEmitter from '../utils/bufferedEventEmitter';

/**
 * Adapter options
 */
export type AdapterOptions = {
    /**
     * @member {http.Server} server Provide an existing web server to use. Will create one otherwise
     */
    server?: Restify.Server;
    /**
     * @member {string | number} port Optional. When options.server is not supplied and an internal web server is to be
     * created, this is the port number it should listen on. If this value is not given, it will attempt to read the
     * PORT environment variable, then default to 3901
     */
    port?: string | number;
};

/**
 * Base Adapter class. Adapters are where connections from hosts are accepted and mapped to Contexts. The host
 * connection requests a Context from a sessionId. If no matching Context is found, a new one is created and
 * the 'connection' event is raised.
 */
export abstract class Adapter {
    protected emitter = new BufferedEventEmitter();

    protected get options() { return this._options; }

    public get server() { return this._options.server; }
    public set server(value: Restify.Server) { this._options.server = value; }
    public get port() { return this._options.port; }

    // tslint:disable-next-line:variable-name
    constructor(protected _options: AdapterOptions) {
        this._options = { ..._options };
        this._options.port =
            this._options.port ||
            process.env.port ||
            process.env.PORT ||
            3901;
    }

    public abstract listen(): Promise<Restify.Server>;

    /**
     * The onConnection event is raised when a new Context is created for an application session. This happens when the
     * first client connects to your application.
     * @event
     */
    public onConnection(handler: (context: Context, params: ParameterSet) => void): this {
        this.emitter.on('connection', handler);
        return this;
    }
}
