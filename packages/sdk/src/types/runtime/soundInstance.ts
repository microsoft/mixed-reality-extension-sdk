/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';
import { log } from '../../log';
import { SetSoundStateOptions, SoundCommand } from '../../sound';
import { createForwardPromise, ForwardPromise } from '../forwardPromise';
import { Actor } from './actor';

export class SoundInstance {

    public id: string;
    public actor: Actor;
    private soundAssetId: string;

    constructor(actor: Actor, soundAssetId: string) {
        this.id = UUID();
        this.actor = actor;
        this.soundAssetId = soundAssetId;
    }

    public start(options: SetSoundStateOptions, startTimeOffset?: number):
        ForwardPromise<SoundInstance> {
        return createForwardPromise(this,
            new Promise<SoundInstance>((resolve, reject) => {
                this.actor.context.assetManager.assetLoaded(this.soundAssetId).then(() => {
                    this.actor.context.internal.setSoundState(
                        this, SoundCommand.Start, options, this.soundAssetId, startTimeOffset);

                    resolve();
                }).catch((reason: any) => {
                    log.error(
                        'app',
                        `Failed StartSound on actor ${this.actor.id}. ${(reason || '').toString()}`.trim());
                    reject();
                });
            })
        );
    }

    public setSoundState(options: SetSoundStateOptions, soundCommand?: SoundCommand) {
        this.actor.context.assetManager.assetLoaded(this.soundAssetId).then(() => {
            if (soundCommand === undefined) {
                soundCommand = SoundCommand.Update;
            }
            this.actor.context.internal.setSoundState(this, soundCommand, options);
        }).catch((reason: any) => {
            log.error('app', `SetSoundState failed ${this.actor.id}. ${(reason || '').toString()}`.trim());
        });
    }

    public pause() {
        this.setSoundState({ paused: true });
    }

    public resume() {
        this.setSoundState({ paused: false });
    }

    public stop() {
        this.setSoundState({}, SoundCommand.Stop);
    }
}
