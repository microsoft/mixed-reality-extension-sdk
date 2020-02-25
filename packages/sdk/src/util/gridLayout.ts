/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Actor, Vector3 } from '..';

/** Describes a relative position in a [[GridLayout]]. */
export enum BoxAlignment {
	/** Position above and to the left of the anchor. */
	TopLeft = 'top-left',
	/** Position directly above the anchor. */
	TopCenter = 'top-center',
	/** Position above and to the right of the anchor. */
	TopRight = 'top-right',
	/** Position directly left of the anchor. */
	MiddleLeft = 'middle-left',
	/** Position directly on top of the anchor. */
	MiddleCenter = 'middle-center',
	/** Position directly right of the anchor. */
	MiddleRight = 'middle-right',
	/** Position below and to the left of the anchor. */
	BottomLeft = 'bottom-left',
	/** Position directly below the anchor. */
	BottomCenter = 'bottom-center',
	/** Position below and to the right of the anchor. */
	BottomRight = 'bottom-right',
}

/** Options for [[GridLayout.addCell]]. */
export interface AddCellOptions {
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

/**
 * Lay out actors in a grid in app space. Assign actors to the grid with [[addCell]],
 * and apply updates with [[applyLayout]].
 */
export class GridLayout {
	private columns: number[] = [];
	private rows: number[] = [];
	private contents: AddCellOptions[] = [];

	/**
	 * Initialize a new grid layout.
	 * @param anchor The grid's anchor actor, the point to which the grid is aligned.
	 * @param gridAlignment How the grid should be aligned to its anchor, where [[BoxAlignment.TopLeft]] will place
	 * the grid above and to the left of the anchor, and the lower right corner will touch the anchor.
	 */
	public constructor(
		private anchor: Actor,
		public gridAlignment = BoxAlignment.MiddleCenter,
		public defaultCellAlignment = BoxAlignment.MiddleCenter
	) { }

	/** The number of columns in this grid. */
	public columnCount() { return this.columns.length; }
	/** THe number of rows in this grid. */
	public rowCount() { return this.rows.length; }
	/** The width of the full grid. */
	public gridWidth() { return this.columns.reduce((sum, x) => sum + x, 0); }
	/** The height of the full grid. */
	public gridHeight() { return this.rows.reduce((sum, x) => sum + x, 0); }

	/**
	 * The width of a particular column.
	 * @param i The column index.
	 */
	public columnWidth(i: number) {
		return this.contents
			.filter(c => c.column === i)
			.reduce((max, c) => Math.max(max, c.width), 0);
	}

	/**
	 * The height of a particular row.
	 * @param i The row index.
	 */
	public rowHeight(i: number) {
		return this.contents
			.filter(c => c.row === i)
			.reduce((max, c) => Math.max(max, c.height), 0);
	}

	/**
	 * Add an actor to the grid. The actor's position will not be updated until [[applyLayout]] is called.
	 * @param options The cell's configuration.
	 */
	public addCell(options: AddCellOptions) {
		const { contents } = options;

		if (contents.parent !== this.anchor) {
			throw new Error("Grid cell contents must be parented to the grid root");
		}

		// insert cell
		this.contents.push(options);
	}

	/** Recompute the positions of all actors in the grid. */
	public applyLayout() {
		const gridAlign = GridLayout.getOffsetFromAlignment(
			this.gridAlignment, this.gridWidth(), this.gridHeight())
			.multiplyByFloats(-1, -1, -1);

		for (const cell of this.contents) {
			const cellPosition = new Vector3(
				this.columns.slice(0, cell.column).reduce((sum, x) => sum + x, 0),
				-this.rows.slice(0, cell.row).reduce((sum, x) => sum + x, 0),
				0
			);
			const cellAlign = GridLayout.getOffsetFromAlignment(
				cell.alignment ?? this.defaultCellAlignment,
				this.columns[cell.column], this.rows[cell.row]
			);
			cell.contents.transform.local.position = gridAlign.add(cellPosition).add(cellAlign);
		}
	}

	private static getOffsetFromAlignment(anchor: BoxAlignment, width: number, height: number) {
		const offset = new Vector3();

		// set horizontal alignment
		switch(anchor) {
			case BoxAlignment.TopRight:
			case BoxAlignment.MiddleRight:
			case BoxAlignment.BottomRight:
				offset.x = 0;
				break;
			case BoxAlignment.TopCenter:
			case BoxAlignment.MiddleCenter:
			case BoxAlignment.BottomCenter:
				offset.x = 0.5;
				break;
			default:
				offset.x = 1;
		}
		// set vertical alignment
		switch (anchor) {
			case BoxAlignment.BottomLeft:
			case BoxAlignment.BottomCenter:
			case BoxAlignment.BottomRight:
				offset.y = 0;
				break;
			case BoxAlignment.MiddleLeft:
			case BoxAlignment.MiddleCenter:
			case BoxAlignment.MiddleRight:
				offset.y = -0.5;
				break;
			default:
				offset.y = -1;
		}

		return offset.multiplyByFloats(width, height, 1);
	}
}
