/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Parameters to the `Sound.setSoundState` and `Actor.startSound` calls.
 */
export type SetSoundStateOptions = {
    /**
     * pitch offset in halftones (0=default, 12=one octave higher, -12=one octave lower)
     */
    pitch?: number,

    /**
     * volume multiplier, (0.0-1.0, where 0.0=no sound, 1.0=maximum)
     */
    volume?: number,

    /**
     * repeat the sound when ended, or turn it off after playing once
     */
    looping?: boolean,

    /**
     * the amount that sound pitch is modified when moving towards/away from sound source.
     * For music and speech, set this to 0, but for regular objects set to 1.0 or higher. Default to 1.0
     */
    doppler?: number,

    /**
     * For multi-channel sounds (like music), mix audio direction (which speakers to play) for each
     * channel between angle to actor (0.0) and the audio file's channels' original direction (1.0).
     * Default to 0.5, which gives a feeling of direction, without collapsing all channels to sound like mono.
     */
    multiChannelSpread?: number
};
