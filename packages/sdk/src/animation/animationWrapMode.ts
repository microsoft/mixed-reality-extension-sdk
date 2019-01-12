/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Indicates how an animation should behave when it reaches the end.
 */
export enum AnimationWrapMode {
    /**
     * When the animation reaches the end, perform these actions:
     *  - Disable the animation.
     *  - Reset the animation time to zero.
     */
    Once = 'once',

    /**
     * Restart the animation at the beginning once it reaches the end.
     */
    Loop = 'loop',

    /**
     * At the end of the animation, run the animation backward to the beginning, and vice versa.
     */
    PingPong = 'ping-pong',
}
