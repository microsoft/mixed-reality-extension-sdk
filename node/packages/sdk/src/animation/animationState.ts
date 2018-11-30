/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Describes an animation state
 */
export type AnimationState = {
    /**
     * The actor this animation state belongs to
     */
    actorId: string;
    /**
     * The name of the animation
     */
    animationName: string;
    /**
     * The time offset of the animation (in seconds)
     */
    animationTime: string;
    /**
     * Whether or not the animation is paused
     */
    paused: boolean;
    /**
     * Whether or not the animation should apply root motion to the parent actor node at the end of the animation
     */
    hasRootMotion: boolean;
};
