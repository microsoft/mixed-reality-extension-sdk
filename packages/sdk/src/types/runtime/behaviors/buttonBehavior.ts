/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionHandler, ActionState, BehaviorType, DiscreteAction, TargetBehavior } from '.';

/**
 * Button behavior class containing the target behavior actions.
 */
export class ButtonBehavior extends TargetBehavior {
    // tslint:disable:variable-name
    private _hover: DiscreteAction = new DiscreteAction();
    private _click: DiscreteAction = new DiscreteAction();
    // tslint:enable:variable-name

    /** @inheritdoc */
    public get behaviorType(): BehaviorType { return 'button'; }

    public get hover() { return this._hover; }
    public get click() { return this._click; }

    /**
     * Add a hover handler to be called when the given hover state is triggered.
     * @param hoverState The hover state to fire the handler on.
     * @param handler The handler to call when the hover state is triggered.
     * @return This button behavior.
     */
    public onHover(hoverState: 'enter' | 'exit', handler: ActionHandler): this {
        const actionState: ActionState = (hoverState === 'enter') ? 'started' : 'stopped';
        this._hover.on(actionState, handler);
        return this;
    }

    /**
     * Add a click handler to be called when the given click state is triggered.
     * @param clickState The click state to fire the handler on.
     * @param handler The handler to call when the click state is triggered.
     * @return This button behavior.
     */
    public onClick(clickState: 'pressed' | 'released', handler: ActionHandler): this {
        const actionState: ActionState = (clickState === 'pressed') ? 'started' : 'stopped';
        this._click.on(actionState, handler);
        return this;
    }

    /**
     * Gets whether the button is being hovered over by the given user, or at all if no user id is given.
     * @param userId The id of the user to check whether they are hovering over this button behavior.
     * @return True if the user is hovering over, false if not.  In the case where no user id is given, this
     * returns true if any user is hovering over, false if none are.
     */
    public isHoveredOver(userId?: string): boolean {
        return this._hover.isActive(userId);
    }

    /**
     * Gets whether the button is being clicked by the given user, or at all if no user id is given.
     * @param userId The id of the user to check whether they are clicking this button behavior.
     * @return True if the user is clicking, false if not.  In the case where no user id is given, this
     * returns true if any user is clicking, false if none are.
     */
    public isClicked(userId?: string): boolean {
        return this._click.isActive(userId);
    }
}
