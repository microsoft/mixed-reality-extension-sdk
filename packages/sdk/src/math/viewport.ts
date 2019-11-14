/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Class used to represent a viewport on screen
 */
export class Viewport {
	/**
	 * Creates a Viewport object located at (x, y) and sized (width, height)
	 * @param x defines viewport left coordinate
	 * @param y defines viewport top coordinate
	 * @param width defines the viewport width
	 * @param height defines the viewport height
	 */
	constructor(
		/** viewport left coordinate */
		public x: number,
		/** viewport top coordinate */
		public y: number,
		/** viewport width */
		public width: number,
		/** viewport height */
		public height: number) {
	}

	/**
	 * Creates a new viewport using absolute sizing (from 0-> width, 0-> height instead of 0->1)
	 * @param renderWidthOrEngine defines either an engine or the rendering width
	 * @param renderHeight defines the rendering height
	 * @returns a new Viewport
	 */
	/*toGlobal(renderWidthOrEngine: number | Engine, renderHeight: number): Viewport {
		if ((<Engine>renderWidthOrEngine).getRenderWidth) {
			var engine = (<Engine>renderWidthOrEngine);
			return this.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
		}
		let renderWidth = <number>renderWidthOrEngine;
		return new Viewport(this.x * renderWidth, this.y * renderHeight, this.width * renderWidth, this.height * renderHeight);
	}*/

	/**
	 * Returns a new Viewport copied from the current one
	 * @returns a new Viewport
	 */
	public clone(): Viewport {
		return new Viewport(this.x, this.y, this.width, this.height);
	}
}
