Grab behavior is implemented as a field on the actor that can be toggled on or off.

`public get grabbable();`
`public set grabbable(value);`

Additionally, there is an API for attaching a grab handler for event states of `'begin'` and `'end'`.

`public onGrab(grabState: 'begin' | 'end', handler: ActionHandler);`

_Note: As with behaviors, only one handler can be attached per grab state._

Grab will be implemented on the client with a reasonable implementation that causes the grab to be relative to the local offset from the input device that the actor is at the time that the grab began.
