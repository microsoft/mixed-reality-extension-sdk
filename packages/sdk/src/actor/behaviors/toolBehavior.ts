/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionHandler, ActionState, BehaviorType, DiscreteAction, TargetBehavior } from '.';

export class ToolBehavior<ToolDataT> extends TargetBehavior {
	private _holding: DiscreteAction<ToolDataT> = new DiscreteAction();
	private _using: DiscreteAction<ToolDataT> = new DiscreteAction();

	/** @inheritdoc */
	public get behaviorType(): BehaviorType { return 'tool'; }

	/**
	 * Add a holding handler to be called when the given hover state is triggered.
	 * @param holdingState The holding state to fire the handler on.
	 * @param handler The handler to call when the holding state is triggered.
	 * @return This tool behavior.
	 */
	public onHolding(holdingState: 'picked-up' | 'holding' | 'dropped', handler: ActionHandler<ToolDataT>): this {
		const actionState: ActionState = 
			(holdingState === 'picked-up') ? 'started' : (holdingState === 'holding') ? 'performing' : 'stopped';
		this._holding.on(actionState, handler);
		return this;
	}

	/**
	 * Add a using handler to be called when the given hover state is triggered.
	 * @param usingState The using state to fire the handler on.
	 * @param handler The handler to call when the using state is triggered.
	 * @return This tool behavior.
	 */
	public onUsing(usingState: 'started' | 'using' | 'stopped', handler: ActionHandler<ToolDataT>): this {
		const actionState: ActionState = 
			(usingState === 'started') ? 'started' : (usingState === 'using') ? 'performing' : 'stopped';
		this._using.on(actionState, handler);
		return this;
	}
}