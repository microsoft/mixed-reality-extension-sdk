/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Parameters to the `Actor.startSound` call.
 */
export type SetAudioStateOptions = {
	/**
	 * pitch offset in halftones (0=default, 12=one octave higher, -12=one octave lower)
	 */
	pitch?: number;

	/**
	 * volume multiplier, (0.0-1.0, where 0.0=no sound, 1.0=maximum)
	 */
	volume?: number;

	/**
	 * repeat the sound when ended, or turn it off after playing once
	 */
	looping?: boolean;

	/**
	 * pause or unpause the sound. Default to false.
	 */
	paused?: boolean;

	/**
	 * the amount that sound pitch is modified when moving towards/away from sound source.
	 * For music and speech, set this to 0, but for regular objects set to 1.0 or higher (up to 5.0). Default to 1.0.
	 */
	doppler?: number;

	/**
	 * Specify how much a sound is non-directional (playing the same volume in each speaker
	 * regardless of facing direction)
	 * vs directional (playing only in the speakers that are pointing towards the sound source).
	 * This can be used to make sounds seem more "wide".
	 * It is also useful for multi-channel sounds (such as music), because a fully directional sound
	 * will always sound like mono.
	 * Default to 0.0. For music and ambient looping sounds, set this between 0.5 and 1.0.
	 */
	spread?: number;

	/**
	 * Sounds will play at full volume until user is this many meters away,
	 * and then volume will decrease logarithmically.
	 * Default to 1.0. For sound that needs to fill up a large space (like a concert), increase this number.
	 */
	rolloffStartDistance?: number;

	/**
	 * The media should start at, or seek this many seconds into the media.
	 * Time is in seconds relative to start of clip.
	 */
	time?: number;
};

/**
 * Parameters to the `Actor.startVideoStream` call.
 */
export type SetVideoStateOptions = {
	/**
	 * volume multiplier, (0.0-1.0, where 0.0=no sound, 1.0=maximum)
	 */
	volume?: number;

	/**
	 * repeat the video when ended, or turn it off after playing once
	 */
	looping?: boolean;

	/**
	 * pause or unpause the video. Default to false.
	 */
	paused?: boolean;

	/**
	 * Specify how much a sound is non-directional (playing the same volume in each speaker
	 * regardless of facing direction)
	 * vs directional (playing only in the speakers that are pointing towards the sound source).
	 * This can be used to make sounds seem more "wide".
	 * It is also useful for multi-channel sounds (such as music), because a fully directional sound
	 * will always sound like mono.
	 * Default to 0.0. For music and ambient looping sounds, set this between 0.5 and 1.0.
	 */
	spread?: number;

	/**
	 * Sounds will play at full volume until user is this many meters away,
	 * and then volume will decrease logarithmically.
	 * Default to 1.0. For sound that needs to fill up a large space (like a concert), increase this number.
	 */
	rolloffStartDistance?: number;

	/**
	 * The media should start at, or seek this many seconds into the media.
	 * Time is in seconds relative to start of clip.
	 */
	time?: number;

	/**
	 * Should the video stream be visible or invisible
	 */
	visible?: boolean;
};

/**
 * Parameters to the `MediaInstance.setState` call.
 */
export type SetMediaStateOptions = SetAudioStateOptions & SetVideoStateOptions;
