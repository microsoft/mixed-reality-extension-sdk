/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SetSoundStateOptions } from '../../sound';

export interface SoundLike {
    enabled: boolean;
    parentId: string;
    soundResourceId: number;
    pitch: number;
    volume: number;
}

export class Sound implements SoundLike {
    public enabled = true;
    public parentId = "";
    public soundResourceId = 0;
    public pitch = 0;
    public volume = 1.0;

    /**
     * PUBLIC METHODS
     */

    /*constructor() {
    }
    */

    public copy(from: Partial<SoundLike>): this {
        if (!from) return this;
        if (from.enabled !== undefined) this.enabled = from.enabled;
        if (from.parentId !== undefined) this.parentId = from.parentId;
        if (from.soundResourceId !== undefined) this.soundResourceId = from.soundResourceId;
        if (from.pitch !== undefined) this.pitch = from.pitch;
        if (from.volume !== undefined) this.volume = from.volume;
        return this;
    }

    public toJSON() {
        return {
            enabled: this.enabled,
            parentId: this.parentId,
            soundResourceId: this.soundResourceId,
            pitch: this.pitch,
            volume: this.volume,
        } as SoundLike;
    }

    public static setSoundState(soundId: string, options: SetSoundStateOptions) {

    }
    public static pause(soundId: string) {

    }
    public static resume(soundId: string) {

    }
    public static stop(soundId: string) {

    }
}
