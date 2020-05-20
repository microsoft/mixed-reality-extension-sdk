/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	ActionHandler,
	ActionState,
	BehaviorType,
	DiscreteAction,
	User
} from '../..';
// break import cycle
import { TargetBehavior, PointData } from './targetBehavior';

/**
 * Interface that represents the button event data passed along though event handler functions.
 */
export interface ButtonEventData {
	/**
	 * The collection of target point data.
	 */
	targetedPoints: PointData[];
}

/**
 * Button behavior class containing the target behavior actions.
 */
export class ButtonBehavior extends TargetBehavior {
	private _hover: DiscreteAction<ButtonEventData> = new DiscreteAction();
	private _click: DiscreteAction<ButtonEventData> = new DiscreteAction();
	private _button: DiscreteAction<ButtonEventData> = new DiscreteAction();

	/** @inheritdoc */
	public get behaviorType(): BehaviorType { return 'button'; }

	/**
	 * Add a hover handler to be called when the given hover state is triggered.
	 * @param hoverState The hover state to fire the handler on.
	 * @param handler The handler to call when the hover state is triggered.
	 * @return This button behavior.
	 */
	public onHover(hoverState: 'enter' | 'hovering' | 'exit', handler: ActionHandler<ButtonEventData>): this {
		const actionState: ActionState = (hoverState === 'enter') ? 'started' 
			: (hoverState === 'hovering') ? 'performing' : 'stopped';
		this._hover.on(actionState, handler);
		return this;
	}

	/**
	 * Add a click handler to be called when the given click state is triggered.
	 * @param handler The handler to call when the click state is triggered.
	 * @return This button behavior.
	 */
	public onClick(handler: ActionHandler<ButtonEventData>): this {
		this._click.on('started', handler);
		return this;
	}

	/**
	 * Add a button handler to be called when a complete button click has occured.
	 * @param buttonState The button state to fire the handler on.
	 * @param handler The handler to call when the click state is triggered.
	 * @return This button behavior.
	 */
	public onButton(buttonState: 'pressed' | 'holding' | 'released', handler: ActionHandler<ButtonEventData>): this {
		const actionState: ActionState = (buttonState === 'pressed') ? 'started' 
			: (buttonState === 'holding') ? 'performing' : 'stopped';
		this._button.on(actionState, handler);
		return this;
	}

	/**
	 * Gets whether the button is being hovered over by the given user, or at all if no user id is given.
	 * @param user The user to check whether they are hovering over this button behavior.
	 * @return True if the user is hovering over, false if not.  In the case where no user id is given, this
	 * returns true if any user is hovering over, false if none are.
	 */
	public isHoveredOver(user?: User): boolean {
		return this._hover.isActive(user);
	}

	/**
	 * Gets whether the button is being clicked by the given user, or at all if no user id is given.
	 * @param user The user to check whether they are clicking this button behavior.
	 * @return True if the user is clicking, false if not.  In the case where no user id is given, this
	 * returns true if any user is clicking, false if none are.
	 */
	public isClicked(user?: User): boolean {
		return this._click.isActive(user);
	}
}
