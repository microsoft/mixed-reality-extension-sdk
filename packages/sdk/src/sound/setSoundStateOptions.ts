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
     * volume modifier, measured in DB (0=default,10=10x power, -10=1/10 power.
     */
    volume?: number,

    /**
     * time in milliseconds
     */
    time?: number,
};
