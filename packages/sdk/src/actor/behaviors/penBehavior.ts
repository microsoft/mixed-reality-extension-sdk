/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BehaviorType, TransformLike } from '../..';
// break import cycle
import { ToolBehavior } from './toolBehavior';


export interface DrawData {
	transform: TransformLike;
	// Potentially additional data to come, such as:
	// pressure: number;
}

export interface PenEventData {
    drawData: DrawData[];
}

/**
 * Pen behavior class containing the target behavior actions.
 */
export class PenBehavior extends ToolBehavior<PenEventData> {
	// private drawOriginActorId: Guid;

	/** @inheritdoc */
	public get behaviorType(): BehaviorType { return 'pen'; }
}
