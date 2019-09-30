# Dialogs

Goal: Display a message to a single user, and return a response.

## Architecture

Create a new method on the `User` object:

```ts
class User {
	/**
	 * Present the user with a modal dialog, and resolve with the response.
	 * @param text A message presented to the user.
	 * @param acceptInput Whether or not the dialog should include a text input field.
	 */
	public prompt(text: string, acceptInput?: boolean): Promise<DialogResponse> { }
}

type DialogResponse = {
	submitted: boolean;
	text?: string;
};
```

## Network

The network messages getting sent to clients might look like this:

```ts
export type ShowDialog = Payload & {
	type: 'show-dialog';
	text: string;
	acceptInput?: boolean;
};

export type DialogResponse = Payload & {
	type: 'dialog-response';
	submitted: boolean;
	text?: string;
}
```

## Sync layer considerations

None. Since the messages are going to and coming from a single client, no synchronization is necessary.

## Client implementation

The dialog should have a per-client implementation, so it can match the aesthetic of the host client. As such, I
propose adding a new factory type to the `InitializeAPI` call:

```cs
public interface IDialogFactory {
	void ShowDialog(string text, bool allowInput, Action<bool,string> callback);
}
```

General recommendation is that these dialogs are queued, so only one is visible at a time, but different clients
may have different solutions to this problem.
