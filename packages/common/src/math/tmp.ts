/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Matrix, Quaternion, Vector3 } from '.';
import Tools from './tools';

/**
 * @hidden
 */
export class MathTmp {
	private static _v: Vector3[];
	private static _m: Matrix[];
	private static _q: Quaternion[];
	public static get Vector3() { if (!this._v) { this._v = Tools.BuildArray(6, Vector3.Zero); } return this._v; }
	public static get Matrix() { if (!this._m) { this._m = Tools.BuildArray(2, Matrix.Identity); } return this._m; }
	public static get Quaternion() { if (!this._q) { this._q = Tools.BuildArray(3, Quaternion.Zero); } return this._q; }
}
