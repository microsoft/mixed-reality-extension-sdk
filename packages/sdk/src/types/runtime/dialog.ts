/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { EventEmitter } from 'events';

import { Context, GroupMask, Texture, User } from '.';

export enum DialogIcon {
	/** A speech bubble */
	Info = 'info',
	/** A yellow exclamation point */
	Warning = 'warning',
	/** A red exclamation point */
	Error = 'error',
	/** A question mark */
	Question = 'question'
}

export interface DialogResponse {
	user: User;
	button: string;
	text?: string;
}

/** Pop a message to users, and get a response */
export class Dialog extends EventEmitter {
	/**
	 * Create a new dialog box to present to users.
	 * @param context An active MRE context.
	 * @param options.text The message to present.
	 * @param options.buttons Label strings for dialog buttons. The user response will contain this string.
	 * @param options.input Whether the dialog should present a text input. Defaults to false.
	 * @param options.recipients Who to send the message to. Defaults to all users.
	 * @param options.icon A graphic to display next to the text. Defaults to none.
	 * @param options.persistent Send this message to late-joining users. Defaults to false.
	 */
	public constructor(private context: Context, options: {
		text: string,
		buttons: string[],
		input?: boolean
		recipients?: GroupMask | User[] | User,
		icon?: DialogIcon | Texture,
		persistent?: boolean
	}) {
		super();
	}

	/** Broadcast the dialog */
	public show() { }

	/** Close the dialog on all clients, and clear persistence. */
	public cancel() { }

	/** Fires every time a user responds to the dialog. */
	public on(eventType: 'response', listener: (response: DialogResponse) => void): this;

	/** Fires when every recipient of the dialog has responded. Never fired for persistent dialogs. */
	public on(eventType: 'finished', listener: (responses: DialogResponse[]) => void): this;

	public on(eventType: 'response' | 'finished', listener: (...args: any[]) => void): this {
		super.on(eventType, listener);
		return this;
	}
}
