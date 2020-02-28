Grid Layout
============

It is often useful to lay out arrays of objects in a grid pattern: UI elements mostly. Because computing the position
of each object in that grid is cumbersome and non-trivial, especially when the contents of the grid change, I propose
adding a utility class that does it for you. `PlanarGridLayout` is the simplest and the first, but this proposal
allows additional layouts to be added later, such as `CurvedGridLayout` or `SphericalGridLayout`

`PlanarGridLayout`'s job is to place each actor in a cell at a given row/column, and guarantee that it has enough
space to not intersect its neighbors. Each cell is given a required width and height value, and the height of the row
and width of the column are guaranteed to be no less than this.

This implementation also supports grid and cell alignment. Each cell, and the grid as a whole, is allocated a box
of a given width and height, and the alignment determines where the content (the actor transform) is placed within
that box. So if you want the grid contents to flow downward from the grid anchor, you'd set `gridAlignment` to
`BottomCenter`. For cells, you generally want to use `MiddleCenter` alignment (the default), but if you have an actor
whose content is not centered on its transform, you might want to align it to an edge instead. The typical example
of this is an actor with text, since text can have its own alignment (called "anchor location").

I would also like to change how text is aligned to conform with this new more intuitive model,
but that's for another proposal.


API Design
-------------

```ts
/**
 * Lay out actors in a grid along the root actor's local XY plane. Assign actors to the grid with [[addCell]],
 * and apply updates with [[applyLayout]].
 */
class PlanarGridLayout {

	/* PROPERTIES - the standard state getters */

	public columnCount() {}
	public rowCount() {}
	public gridWidth() {}
	public gridHeight() {}
	public columnWidth(i: number) {}
	public rowHeight(i: number) {}
	public columnWidths() {}
	public rowHeights() {}

	/* METHODS */

	/**
	 * Initialize a new grid layout.
	 * @param anchor The grid's anchor actor, the point to which the grid is aligned.
	 * @param gridAlignment How the grid should be aligned to its anchor, where [[BoxAlignment.TopLeft]] will place
	 * the grid above and to the left of the anchor, and the lower right corner will touch the anchor.
	 * @param defaultCellAlignment How cells should be aligned by default.
	 */
	public constructor(
		private anchor: Actor,
		public gridAlignment = BoxAlignment.MiddleCenter,
		public defaultCellAlignment = BoxAlignment.MiddleCenter
	) { }

	/**
	 * Add an actor to the grid. The actor's position will not be updated until [[applyLayout]] is called.
	 * @param options The cell's configuration.
	 */
	public addCell(options: AddCellOptions) { }

	/**
	 * Recompute the positions of all actors in the grid. Only modifies local position x and y for each actor.
	 * @param animateDuration How long it should take the actors to align to the grid. Defaults to instantly.
	 * @param animateCurve The actors' velocity curve.
	 */
	public applyLayout(animateDuration = 0, animateCurve = AnimationEaseCurve.EaseOutQuadratic) { }
}

/** Options for [[GridLayout.addCell]]. */
interface AddCellOptions {
	/** The actor to be placed in the grid cell. Must be parented to the grid root. */
	contents: Actor;
	/** The row index, with 0 at the top. */
	row: number;
	/** The column index, with 0 on the left. */
	column: number;
	/** The width of this cell for layout purposes. Should include any desired padding. */
	width: number;
	/** The height of this cell for layout purposes. Should include any desired padding. */
	height: number;
	/** Where the actor should be placed within the cell box. Defaults to [[GridLayout.defaultCellAlignment]]. */
	alignment?: BoxAlignment;
}

/** Basically just a rename of TextAnchorLocation, but not text specific */
enum BoxAlignment { TopLeft, ..., BottomRight }
```


Network Messaging
-------------------

No change.


Synchronization Concerns
----------------------------

No change.


Unity Concerns
-------------------

No change.


Examples
----------------

```ts
const grid = new MRE.PlanarGridLayout(root, MRE.BoxAlignment.BottomCenter);
const spacing = 2 / (25 - 1);
for (let i = 0; i < count; i++) {
	grid.addCell({
		row: Math.floor(i / 25),
		column: i % 25,
		width: spacing,
		height: spacing,
		contents: MRE.Actor.Create(this.app.context, { actor: {
			name: 'ball',
			parentId: root.id,
			appearance: { meshId: ball.id }
		}})
	});
}
grid.applyLayout();
```