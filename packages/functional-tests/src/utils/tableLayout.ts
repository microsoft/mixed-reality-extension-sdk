/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const sumFn = (sum: number, x: number) => sum + x;

export class TableLayout {
	private rowHeights: number[];
	private columnWidths: number[];
	private cells: MRE.Actor[][];

	public get rowCount() { return this.rowHeights.length; }
	public get columnCount() { return this.columnWidths.length; }
	public get totalWidth() { return this.columnWidths.reduce(sumFn, 0); }
	public get totalHeight() { return this.rowHeights.reduce(sumFn, 0); }

	public constructor(rowCount: number, columnCount: number, rowHeight = 0.1, columnWidth = 0.5) {
		this.rowHeights = new Array(rowCount).fill(rowHeight);
		this.columnWidths = new Array(columnCount).fill(columnWidth);
		this.cells = [];
		for (let i = 0; i < rowCount; i++) {
			this.cells.push(new Array(columnCount));
		}
	}

	public setCellContents(row: number, column: number, actor: MRE.Actor) {
		this.cells[row][column] = actor;
		actor.transform.local.position.set(
			-this.totalWidth / 2 + (this.columnWidths.slice(0, column).reduce(sumFn, 0) + this.columnWidths[column] / 2),
			this.totalHeight / 2 - (this.rowHeights.slice(0, row).reduce(sumFn, 0) + this.rowHeights[row] / 2),
			0
		);
		return actor;
	}
}
