/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from 'events';

import { Guid, log, newGuid } from '../..';
import {
	Connection,
	ExportedPromise,
	Message,
	Payloads,
	Protocols
} from '../../internal';

/**
 * @hidden
 * Class to handle sending and receiving messages with a client.
 */
export class Protocol extends EventEmitter {
	private middlewares: Protocols.Middleware[] = [];

	private promise: Promise<void>;
	private promiseResolve: (value?: void | PromiseLike<void>) => void;
	private promiseReject: (reason?: any) => void;

	public get conn() { return this._conn; }
	public get promises() { return this.conn.promises; }
	public get name() { return this.constructor.name; }

	constructor(private _conn: Connection) {
		super();
		this.onReceive = this.onReceive.bind(this);
		this.onClose = this.onClose.bind(this);
		this.promise = new Promise<void>((resolve, reject) => {
			this.promiseResolve = resolve;
			this.promiseReject = reject;
		});
	}

	public async run() {
		try {
			this.startListening();
			await this.completed();
		} catch (e) {
			this.reject(e);
		}
	}

	public async completed() {
		return this.promise;
	}

	public use(middleware: Protocols.Middleware) {
		this.middlewares.push(middleware);
	}

	public startListening() {
		log.debug('network', `${this.name} started listening`);
		this.conn.on('recv', this.onReceive);
		this.conn.on('close', this.onClose);
	}

	public stopListening() {
		this.conn.off('recv', this.onReceive);
		this.conn.off('close', this.onClose);
		log.debug('network', `${this.name} stopped listening`);
	}

	public sendPayload(payload: Partial<Payloads.Payload>, promise?: ExportedPromise) {
		this.sendMessage({ payload }, promise);
	}

	public sendMessage(
		message: Message,
		promise?: ExportedPromise,
		timeoutSeconds?: number,
		serializedMessage?: Buffer
	) {
		message.id = message.id ?? newGuid();

		// Run message through all the middlewares
		const middlewares = this.middlewares.slice();
		for (const middleware of middlewares) {
			if (middleware.beforeSend) {
				message = middleware.beforeSend(message, promise);
				if (!message) {
					if (promise && promise.reject) {
						promise.reject();
					}
					return;
				}
			}
		}

		const setReplyTimeout = () => {
			if (timeoutSeconds > 0) {
				return setTimeout(() => {
					const reason = `${this.name} timed out awaiting response for ${message.payload.type}, ` +
						`id:${message.id}.`;
					log.error('network', reason);
					this.rejectPromiseForMessage(message.id, reason);
					this.conn.close();
				}, timeoutSeconds * 1000);
			}
		};

		// Save the reply callback
		if (promise) {
			this.promises.set(message.id, {
				promise,
				timeout: setReplyTimeout()
			});
		}

		// log.verbose('network', `${this.name} send id:${message.id.substr(0, 8)}, type:${message.payload.type}`);
		// log.verbose('network-content', JSON.stringify(message, (key, value) => filterEmpty(value)));

		this.conn.send(message, serializedMessage);
	}

	public recvMessage(message: Message) {
		/*if (message.replyToId) {
			log.verbose('network', `${this.name} recv id:${message.id.substr(0, 8)}, ` +
				`replyTo:${message.replyToId.substr(0, 8)}, type:${message.payload.type}`);
		} else {
			log.verbose('network', `${this.name} recv id:${message.id.substr(0, 8)}, ` +
				`type:${message.payload.type}`);
		}
		log.verbose('network-content', JSON.stringify(message, (key, value) => filterEmpty(value)));*/

		// Run message through all the middlewares
		const middlewares = this.middlewares.slice();
		for (const middleware of middlewares) {
			if (middleware.beforeRecv) {
				message = middleware.beforeRecv(message);
				if (!message) {
					return;
				}
			}
		}

		if (message.replyToId) {
			this.handleReplyMessage(message);
		} else {
			this.recvPayload(message.payload);
		}
	}

	public recvPayload(payload: Partial<Payloads.Payload>) {
		if (payload && payload.type && payload.type.length) {
			const handler = (this as any)[`recv-${payload.type}`] || (() => {
				log.error('network', `[ERROR] ${this.name} has no handler for payload ${payload.type}!`);
			});
			handler(payload);
		} else {
			log.error('network', `[ERROR] ${this.name} invalid message payload!`);
		}
	}

	public drainPromises() {
		if (Object.keys(this.promises).length) {
			return new Promise<void>((resolve, reject) => {
				/* eslint-disable @typescript-eslint/no-use-before-define */
				const check = (): NodeJS.Timeout | void => Object.keys(this.promises).length ? set() : resolve();
				const set = () => setTimeout(() => check(), 10);
				set();
				/* eslint-enable @typescript-eslint/no-use-before-define */
				// TODO: Would be better to not have to check on a timer here
			});
		}
	}

	protected resolve() {
		this.stopListening();
		this.promiseResolve();
	}

	protected reject(e?: any) {
		this.stopListening();
		this.promiseReject(e);
	}

	protected handleReplyMessage(message: Message) {
		const queuedPromise = this.promises.get(message.replyToId);
		if (!queuedPromise) {
			this.missingPromiseForReplyMessage(message);
		} else {
			this.promises.delete(message.replyToId);
			clearTimeout(queuedPromise.timeout);
			queuedPromise.promise.resolve(message.payload, message);
		}
	}

	private rejectPromiseForMessage(messageId: Guid, reason?: any) {
		const queuedPromise = this.promises.get(messageId);
		if (queuedPromise?.promise?.reject) {
			try { clearTimeout(queuedPromise.timeout); } catch { }
			try { this.promises.delete(messageId); } catch { }
			try { queuedPromise.promise.reject(reason); } catch { }
		}
	}

	protected missingPromiseForReplyMessage(message: Message) {
		log.error('network', `[ERROR] ${this.name} received unexpected reply message! ` +
			`payload: ${message.payload.type}, replyToId: ${message.replyToId}`);
	}

	private onReceive = (message: Message) => {
		this.recvMessage(message);
	};

	private onClose = () => {
		for (const id of this.promises.keys()) {
			this.rejectPromiseForMessage(id, "Connection closed.");
		}
	};
}
