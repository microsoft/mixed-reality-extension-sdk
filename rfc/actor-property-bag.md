# RFC - Actor Property Bag

Proposal: Add a property bag to the Actor type. Changes to the contents of the property bag are synchronized.

## Why?

An a synchronized per-actor open/extensible property bag is needed for the remote web browser MRE, allowing the MRE to configure the remote browser and for this state to be synchronized to new clients upon join.

## Example

```ts
	actor.properties['url'] = 'https://...';
	// And then later:
	delete actor.properties['url'];
```

## C#

The runtime will raise an event when the contents of the property bag change. The runtime will hook into this event for certain Actor types.
