/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Indicates how an animation should behave when it reaches the end.
 */
export enum AnimationWrapMode {
    /**
     * Stop the animation once it reaches then end.
     */
    Once = 'once',

    /**
     * Restart the animation at the beginning once it reaches the end.
     */
    Loop = 'loop',
}
