# Dialogs

Goal: Display a message and an optional graphic to all users, or some, or one, and return a response.

## Architecture

Create a new `Dialog` class that manages calls and responses. It is also a good place to park static convenience
functions and event listeners. I propose a couple different setup options:

1. `type` - What sort of response we should expect.
	1. A `message` dialog presents an OK button, and returns no value, just a confirmation that OK was clicked.
	2. A `confirm` dialog presents OK and Cancel buttons, and returns a boolean.
	3. A `prompt` dialog presents a text field and OK/Cancel buttons, and returns the contents of the text field.
2. `text` - The text that the dialog displays.
3. `recipients` (optional) - The dialog is displayed to all currently connected users by default, but can be restricted
	to a subset of users with this option. Takes either a `GroupMask`, a `User[]`, or just one `User`. This filtering
	could be implemented in the sync layer fairly easily, I think.
4. `icon` (optional) - A graphic to display alongside the text. Can be one of the built-in icons (`info`, `warning`,
	`error`, or `question`), or a custom texture supplied by the developer.
5. `persistent` (optional) - If `true`, the dialog is presented to users in the recipients list even if they are
	not currently online. I imagine this would be implemented by an extra handler to `context.onUserJoined`, with
	special logic to not send the dialog to the same user more than once. This is complicated by changing membership
	in groups, not sure how to handle that yet.

Once the dialog is set up, you would call `dialog.send()` to deliver the messages to clients. If you need to hide
the dialog programmatically, call `dialog.cancel()`.

To receive the replies, the developer would listen to events on the dialog instance. I'm proposing one event fired
when a single response comes in:

```ts
public on(eventType: 'response', listener: (user: User, response: string | boolean) => void): this;
```

And another when all the responses are in, if it's not a persistent dialog. This version requires collecting all the
responses inside the dialog class so they can be passed together into this callback:

```ts
public on(eventType: 'finished', listener: (responses: { [userId: string]: string | boolean }) => void): this;
```

## Network

The network messages getting sent to clients might look like this:

```ts
export type ShowDialog = Payload & {
	type: 'show-dialog';
	dialogId: string; // a unique ID from a particular Dialog instance
	dialogType: string;
	text: string;
	recipients?: string[]; // a list of user IDs. GroupMasks have already been unpacked
	icon?: string; // either one of the known icon types, or the UUID of a texture
};

export type DialogResponse = Payload & {
	type: 'dialog-response';
	dialogId: string;
	userId: string;
	booleanResponse?: boolean;
	stringResponse?: string;
}
```

## Sync layer considerations

The dialog messages will never be stored in the sync layer. They are only relevant to users, and users are not
synchronized there. The sync layer will only be routing messages to clients hosting recipient users.
