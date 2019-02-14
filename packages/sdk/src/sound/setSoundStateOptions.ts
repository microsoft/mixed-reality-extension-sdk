/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Parameters to the `Sound.setSoundState` and `Actor.playSound` calls.
 */
export type SetSoundStateOptions = {
    /**
     * enabled (pause/resume).
     */
    enabled?: boolean,

    /**
     * pitch offset in halftones (0=default, 12=one octave higher, -12=one octave lower)
     */
    pitch?: number,

    /**
     * volume multiplier, (0.0-1.0, where 0.0=no sound, 1.0=maximum)
     */
    volume?: number,

};
