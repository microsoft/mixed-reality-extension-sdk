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
                this.actor.created().then(() => {
                    this.actor.context.assetManager.assetLoaded(this.soundAssetId).then(() => {
                        this.actor.context.internal.setSoundState(
                            this, options, SoundCommand.Start, this.soundAssetId, startTimeOffset);

                        resolve();
                    }).catch((reason: any) => {
                        log.error(
                            'app',
                            `Failed StartSound on actor ${this.actor.id}. ${(reason || '').toString()}`.trim());
                        reject();
                    });
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
        this.actor.created().then(() => {
            this.actor.context.assetManager.assetLoaded(this.soundAssetId).then(() => {
                this.actor.context.internal.setSoundState(this, options, soundCommand);
            }).catch((reason: any) => {
                log.error('app', `SetSoundState failed ${this.actor.id}. ${(reason || '').toString()}`.trim());
            });
        }).catch((reason: any) => {
            log.error('app', `SetSoundState failed ${this.actor.id}. ${(reason || '').toString()}`.trim());
        });

    }

    public pause() {
        this.setSoundState({}, SoundCommand.Pause);
    }

    public resume() {
        this.setSoundState({}, SoundCommand.Resume);
    }

    public stop() {
        this.setSoundState({}, SoundCommand.Stop);
    }
}
