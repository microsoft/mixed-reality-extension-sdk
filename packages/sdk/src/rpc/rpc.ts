/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Context } from '..';
import { AppToEngineRPC, EngineToAppRPC } from '../types/network/payloads';

// tslint:disable:max-classes-per-file no-string-literal
/**
 * @hidden
 * Type defining an rpc handler function callback.
 */
export type RPCHandler = (options: { userId: string }, ...args: any[]) => void;

/**
 * RPC interface. Able to send and receive RPC calls.
 */
export class RPC {
	private handlers = new Map<string, RPCHandler>();

	public get context() { return this._context; }

	// tslint:disable-next-line:variable-name
	constructor(protected _context: Context) {
	}

	public on(procName: string, handler: RPCHandler) {
		if (handler) {
			this.handlers.set(procName, handler);
		} else {
			this.handlers.delete(procName);
		}
	}

	public removeAllHandlers() {
		this.handlers.clear();
	}

	public send(
		options: {
			procName: string,
			channelName?: string,
			userId?: string
		},
		...args: any[]) {
		this.context.internal.sendPayload({
			type: 'app2engine-rpc',
			procName: options.procName,
			channelName: options.channelName,
			userId: options.userId,
			args
		} as AppToEngineRPC);
	}

	public receive(procName: string, userId: string, ...args: any[]) {
		const handler = this.handlers.get(procName);
		if (handler) {
			handler({ userId }, ...args);
		}
	}
}

/**
 * RPC channel interface. Able to route channel messages to handlers.
 */
export class RPCChannels {
	private channelHandlers = new Map<string, RPC>();
	private globalHandler: RPC;

	public setChannelHandler(channelName: string, handler: RPC) {
		if (channelName) {
			if (handler) {
				this.channelHandlers.set(channelName, handler);
			} else {
				this.channelHandlers.delete(channelName);
			}
		} else {
			this.globalHandler = handler;
		}
	}

	public receive(payload: EngineToAppRPC) {
		let handler: RPC;
		if (payload.channelName) {
			handler = this.channelHandlers.get(payload.channelName);
		} else {
			handler = this.globalHandler;
		}
		if (handler) {
			handler.receive(payload.procName, payload.userId, ...payload.args);
		}
	}
}
