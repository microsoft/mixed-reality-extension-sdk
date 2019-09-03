/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { EventEmitter } from 'events';

import { Context, GroupMask, Texture, User } from '.';

/** The types of dialog boxes */
export enum DialogType {
	/** A dialog with text, an icon, and an OK button */
	Message = 0,
	/** A dialog with text, an icon, and OK and Cancel buttons */
	Confirm,
	/** A dialog with prompt text, a text input field, and OK and Cancel buttons */
	Prompt
}


export enum DialogIcon {
	/** A speech bubble */
	Info = 0,
	/** A yellow exclamation point */
	Warning,
	/** A red exclamation point */
	Error,
	/** A question mark */
	Question
}

/** Pop a message to users, and get a response */
export class Dialog extends EventEmitter {
	/**
	 * Create a new dialog box to present to users.
	 * @param context An active MRE context.
	 * @param options.type How to present the choice to users.
	 * @param options.text The message to present.
	 * @param options.recipients Who to send the message to. Defaults to all users.
	 * @param options.icon A graphic to display next to the text. Defaults to none.
	 * @param options.persistent Send this message to late-joining users. Defaults to false.
	 */
	public constructor(private context: Context, options: {
		type: DialogType,
		text: string,
		recipients?: GroupMask | User[] | User,
		icon?: DialogIcon | Texture,
		persistent?: boolean
	}) {
		super();
	}

	/** Convenience method for broadcasting a message */
	public static Message(context: Context, text: string): Dialog { }

	/** Convenience method for broadcasting a confirmation request */
	public static Confirm(context: Context, text: string): Dialog { }

	/** Convenience method for broadcasting a text prompt */
	public static Prompt(context: Context, text: string): Dialog { }

	/** Convenience method for sending a message to a single user */
	public static MessagePrivate(context: Context, user: User, text: string): Promise<void> { }

	/** Convenience method for sending a confirmation request to a single user */
	public static ConfirmPrivate(context: Context, user: User, text: string): Promise<boolean> { }

	/** Convenience method for sending a text prompt to a single user */
	public static PromptPrivate(context: Context, user: User, text: string): Promise<string> { }

	/** Broadcast the dialog */
	public send() { }

	/** Close the dialog on all clients, and clear persistence. */
	public cancel() { }

	/** Fires every time a user responds to the dialog. */
	public on(eventType: 'response', listener: (user: User, response: string | boolean) => void): this;

	/** Fires when every recipient of the dialog has responded. Never fired for persistent dialogs. */
	public on(eventType: 'finished', listener: (responses: { [userId: string]: string | boolean }) => void): this;

	public on(eventType: 'response' | 'finished', listener: (...args: any[]) => void): this {
		super.on(eventType, listener);
		return this;
	}
}
