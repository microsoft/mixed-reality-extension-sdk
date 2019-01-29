/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as events from 'events';
import EventEmitterLike from './eventEmitterLike';

interface QueuedEvent {
    args: any[];
}

/** @hidden */
export default class BufferedEventEmitter implements EventEmitterLike {
    private emitter = new events.EventEmitter();
    private queuedEvents: { [key: string]: QueuedEvent[] } = {};

    public clearAll() {
        this.emitter.removeAllListeners();
    }
    public on(event: string | symbol, listener: (...args: any[]) => void): this {
        this.emitter.on(event, listener);
        process.nextTick(() => {
            const queuedEvents = (this.queuedEvents[event.toString()] || []).splice(0);
            delete this.queuedEvents[event.toString()];
            for (const queuedEvent of queuedEvents) {
                this.emit(event, ...queuedEvent.args);
            }
        });
        return this;
    }

    public once(event: string | symbol, listener: (...args: any[]) => void): this {
        this.emitter.once(event, listener);
        process.nextTick(() => {
            const queuedEvents = (this.queuedEvents[event.toString()] || []).splice(0);
            delete this.queuedEvents[event.toString()];
            for (const queuedEvent of queuedEvents) {
                this.emit(event, ...queuedEvent.args);
            }
        });
        return this;
    }

    public off(event: string | symbol, listener: (...args: any[]) => void): this {
        this.emitter.removeListener(event, listener);
        return this;
    }

    public emit(event: string | symbol, ...args: any[]): boolean {
        if (this.emitter.listeners(event).length) {
            return this.emitter.emit(event, ...args);
        } else {
            if (!this.queuedEvents[event.toString()]) {
                this.queuedEvents[event.toString()] = [];
            }
            this.queuedEvents[event.toString()].push({ args });
            return false;
        }
    }
}
