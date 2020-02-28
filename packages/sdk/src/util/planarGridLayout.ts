/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Actor, Animation, AnimationEaseCurves, BoxAlignment, InvertBoxAlignment, Vector3 } from '..';

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

const sumFn = (sum: number, x: number) => sum + x;
const maxFn = (max: number, x: number) => Math.max(max, x);

/**
 * Lay out actors in a grid along the root actor's local XY plane. Assign actors to the grid with [[addCell]],
 * and apply updates with [[applyLayout]].
 */
export class PlanarGridLayout {
	private contents: AddCellOptions[] = [];

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

	/** The number of columns in this grid. */
	public getColumnCount() {
		return this.contents.map(c => c.column).reduce(maxFn, -1) + 1;
	}

	/** The number of rows in this grid. */
	public getRowCount() {
		return this.contents.map(c => c.row).reduce(maxFn, -1) + 1;
	}

	/** The width of the full grid. */
	public getGridWidth() {
		const colCount = this.getColumnCount();
		let width = 0;
		for (let i = 0; i < colCount; i++) {
			width += this.getColumnWidth(i);
		}
		return width;
	}

	/** The height of the full grid. */
	public getGridHeight() {
		const rowCount = this.getRowCount();
		let height = 0;
		for (let i = 0; i < rowCount; i++) {
			height += this.getRowHeight(i);
		}
		return height;
	}

	/**
	 * The width of a particular column.
	 * @param i The column index.
	 */
	public getColumnWidth(i: number) {
		return this.contents.filter(c => c.column === i).map(c => c.width).reduce(maxFn, 0);
	}

	/**
	 * The height of a particular row.
	 * @param i The row index.
	 */
	public getRowHeight(i: number) {
		return this.contents.filter(c => c.row === i).map(c => c.height).reduce(maxFn, 0);
	}

	/** The widths of every column. */
	public getColumnWidths() {
		return this.contents.reduce((arr, c) => {
			arr[c.column] = Math.max(arr[c.column] ?? 0, c.width);
			return arr;
		}, [] as number[]);
	}

	/** The heights of every row. */
	public getRowHeights() {
		return this.contents.reduce((arr, c) => {
			arr[c.row] = Math.max(arr[c.row] ?? 0, c.height);
			return arr;
		}, [] as number[]);
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
	public applyLayout(animateDuration = 0, animateCurve = AnimationEaseCurves.EaseOutQuadratic) {
		const colWidths = this.getColumnWidths();
		const rowHeights = this.getRowHeights();
		const gridAlign = PlanarGridLayout.getOffsetFromAlignment(
			InvertBoxAlignment(this.gridAlignment),
			colWidths.reduce(sumFn, 0),
			rowHeights.reduce(sumFn, 0))
			.negate();

		for (const cell of this.contents) {
			const cellPosition = new Vector3(
				colWidths.slice(0, cell.column).reduce(sumFn, 0),
				-rowHeights.slice(0, cell.row).reduce(sumFn, 0),
				cell.contents.transform.local.position.z);
			const cellAlign = PlanarGridLayout.getOffsetFromAlignment(
				cell.alignment ?? this.defaultCellAlignment,
				colWidths[cell.column], rowHeights[cell.row]
			);

			const destination = gridAlign.add(cellPosition).add(cellAlign);
			if (animateDuration > 0) {
				Animation.AnimateTo(
					cell.contents.context,
					cell.contents,
					{
						destination: { transform: { local: { position: destination } } },
						duration: animateDuration,
						easing: animateCurve
					}
				);
			} else {
				cell.contents.transform.local.position = destination;
			}
		}
	}

	private static getOffsetFromAlignment(anchor: BoxAlignment, width: number, height: number) {
		const offset = new Vector3();

		// set horizontal alignment
		switch(anchor) {
			case BoxAlignment.TopRight:
			case BoxAlignment.MiddleRight:
			case BoxAlignment.BottomRight:
				offset.x = 1;
				break;
			case BoxAlignment.TopCenter:
			case BoxAlignment.MiddleCenter:
			case BoxAlignment.BottomCenter:
				offset.x = 0.5;
				break;
			default:
				offset.x = 0;
		}
		// set vertical alignment
		switch (anchor) {
			case BoxAlignment.BottomLeft:
			case BoxAlignment.BottomCenter:
			case BoxAlignment.BottomRight:
				offset.y = -1;
				break;
			case BoxAlignment.MiddleLeft:
			case BoxAlignment.MiddleCenter:
			case BoxAlignment.MiddleRight:
				offset.y = -0.5;
				break;
			default:
				offset.y = 0;
		}

		return offset.multiplyByFloats(width, height, 1);
	}
}
