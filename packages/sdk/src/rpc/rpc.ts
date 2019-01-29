/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Context, User } from '..';
import { AppToEngineRPC } from '../types/network/payloads';

// tslint:disable:max-classes-per-file no-string-literal
/**
 * @hidden
 * Type defining an rpc handler function callback.
 */
export type RPCHandler = (...args: any[]) => void;

class RPCHandlerSet {
    [id: string]: RPCHandler;
}

/**
 * @hidden
 * Base RPC interface. Able to send and receive RPC calls.
 */
export class RPC {
    private handlers: RPCHandlerSet = {};

    public get context() { return this._context; }

    // tslint:disable-next-line:variable-name
    constructor(protected _context: Context) {
    }

    public on(procName: string, handler: RPCHandler) {
        this.handlers[procName] = handler;
    }

    public send(procName: string, ...args: any[]) {
        this.context.internal.sendPayload({
            type: 'app2engine-rpc',
            userId: (this as any)['userId'], // will return userId for UserRPC, undefined otherwise.
            procName,
            args
        } as AppToEngineRPC);
    }

    public emit = this.send;

    public receive(procName: string, ...args: any[]) {
        const handler = this.handlers[procName];
        if (handler) {
            handler(...args);
        }
    }
}

/**
 * @hidden
 * RPC interface bound to a user. Able to join and leave channels.
 */
export class UserRPC extends RPC {

    public get userId() { return this.user.id; }

    constructor(private user: User) {
        super(user.context);
        // this.user.internal.__rpc = this;
    }

    public join(channelName: string) {
        const contextrpc = this.user.context.internal.__rpc;
        if (contextrpc) {
            contextrpc.channel(channelName).join(this.user.id);
        }
    }

    public leave(channelName: string) {
        const contextrpc = this.user.context.internal.__rpc;
        if (contextrpc) {
            contextrpc.channel(channelName).leave(this.user.id);
        }
    }
}

/**
 * @hidden
 * RPC Channel interface. Able to send and receive RPC calls targeted to a channel.
 */
export class RPCChannel {
    private userIds: string[] = [];

    public get name() { return this._name; }

    // tslint:disable-next-line:variable-name
    constructor(private context: Context, private _name: string) {
    }

    public isEmpty() {
        return this.userIds.length === 0;
    }

    public contains(userId: string) {
        return !!this.userIds.find(value => value === userId);
    }

    public join(userId: string) {
        if (!this.contains(userId)) {
            this.userIds.push(userId);
        }
    }

    public leave(userId: string) {
        this.userIds = this.userIds.filter(value => value !== userId);
    }

    public send(procName: string, ...args: any[]) {
        this.userIds.forEach(userId => {
            const user = this.context.user(userId);
            if (user) {
                const userrpc = user.internal.__rpc;
                if (userrpc) {
                    userrpc.send(procName, args);
                }
            }
        });
    }

    public emit = this.send;

    public receive(procName: string, ...args: any[]) {
        this.userIds.forEach(userId => {
            const user = this.context.user(userId);
            if (user) {
                const userrpc = user.internal.__rpc;
                if (userrpc) {
                    userrpc.receive(procName, args);
                }
            }
        });
    }
}

/**
 * @hidden
 * RPC interface bound to an context instance.
 */
export class ContextRPC extends RPC {
    private channels: { [id: string]: RPCChannel } = {};

    /**
     * Creates a new RPC interface instance.
     * @param context The context that the interface should be attached to.
     */
    constructor(context: Context) {
        super(context);
        if (this.context.internal.__rpc === undefined) {
            this.context.internal.__rpc = this;
        }
        this._receive = this._receive.bind(this);
        this.context.onReceiveRPC(this._receive);
    }
    public cleanup() {
        if (this.context.internal.__rpc === this) {
            this.context.internal.__rpc = undefined;
        }
        this.context.offReceiveRPC(this._receive);
    }

    public channel(channelName: string, create = true) {
        if (!this.channels[channelName]) {
            if (create) {
                this.channels[channelName] = new RPCChannel(this.context, channelName);
            }
        }
        return this.channels[channelName];
    }

    public to = this.channel;

    public leaveAll(userId: string) {
        Object.keys(this.channels).forEach(key => {
            this.channels[key].leave(userId);
            if (this.channels[key].isEmpty()) {
                delete this.channels[key];
            }
        });
    }

    private _receive(procName: string, channelName: string, args: any[]) {
        if (channelName) {
            const channel = this.channel(channelName, false);
            if (channel) {
                channel.receive(procName, args);
            }
        } else {
            super.receive(procName, args);
        }
    }
}
