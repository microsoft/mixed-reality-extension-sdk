/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Actor, Vector3 } from '..';


export enum BoxAlignment {
	TopLeft = 'top-left',
	TopCenter = 'top-center',
	TopRight = 'top-right',
	MiddleLeft = 'middle-left',
	MiddleCenter = 'middle-center',
	MiddleRight = 'middle-right',
	BottomLeft = 'bottom-left',
	BottomCenter = 'bottom-center',
	BottomRight = 'bottom-right',
}

export interface AddCellOptions {
	contents: Actor;
	row: number;
	column: number;
	width: number;
	height: number;
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
	 * the grid above and to the left of the anchor.
	 */
	public constructor(
		private anchor: Actor,
		public gridAlignment = BoxAlignment.MiddleCenter,
	) { }

	public tableWidth() { return this.columns.reduce((sum, x) => sum + x, 0); }
	public tableHeight() { return this.rows.reduce((sum, x) => sum + x, 0); }
	public columnWidth(i: number) { return this.columns[i] ?? 0; }
	public rowHeight(i: number) { return this.rows[i] ?? 0; }

	public addCell(options: AddCellOptions) {
		const { contents, row, column, width, height } = options;

		if (contents.parent !== this.anchor) {
			throw new Error("Grid cell contents must be parented to the grid root");
		}

		// update row/column dimensions
		while (this.rows.length <= row) {
			this.rows.push(0);
		}
		while (this.columns.length <= column) {
			this.columns.push(0);
		}
		this.rows[row] = Math.max(this.rows[row], height);
		this.columns[column] = Math.max(this.columns[column], width);

		// insert cell
		this.contents.push(options);
	}

	public applyLayout() {
		const gridAlign = getOffsetFromAlignment(this.gridAlignment, this.tableWidth(), this.tableHeight())

		for (const cell of this.contents) {
			const cellPosition = new Vector3(
				this.columns.slice(0, cell.column).reduce((sum, x) => sum + x, 0) + this.columns[cell.column] / 2,
				-this.rows.slice(0, cell.row).reduce((sum, x) => sum + x, 0) - this.rows[cell.row] / 2,
				0
			);
			cell.contents.transform.local.position =
				gridAlign
				.add(cellPosition);
		}
	}
}

function getOffsetFromAlignment(anchor: BoxAlignment, width: number, height: number) {
	let offset = new Vector3();

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
			offset.x = -0.5;
			break;
		default:
			offset.x = -1;
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
			offset.y = 0.5;
			break;
		default:
			offset.y = 1;
	}

	return offset.multiplyByFloats(width, height, 1);
}
