/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3 } from '.';

// tslint:disable:member-ordering

/**
 * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
 * A Curve3 is designed from a series of successive Vector3.
 * @see https://doc.babylonjs.com/how_to/how_to_use_curve3
 */
export class Curve3 {
	// tslint:disable:variable-name
	private _points: Vector3[];
	private _length = 0.0;
	// tslint:enable:variable-name

	/**
	 * Returns a Curve3 object along a Quadratic Bezier curve :
	 * http://doc.babylonjs.com/tutorials/How_to_use_Curve3#quadratic-bezier-curve
	 * @param v0 (Vector3) the origin point of the Quadratic Bezier
	 * @param v1 (Vector3) the control point
	 * @param v2 (Vector3) the end point of the Quadratic Bezier
	 * @param nbPoints (integer) the wanted number of points in the curve
	 * @returns the created Curve3
	 */
	public static CreateQuadraticBezier(v0: Vector3, v1: Vector3, v2: Vector3, nbPoints: number): Curve3 {
		nbPoints = nbPoints > 2 ? nbPoints : 3;
		const bez = new Array<Vector3>();
		const equation = (t: number, val0: number, val1: number, val2: number) => {
			const res = (1.0 - t) * (1.0 - t) * val0 + 2.0 * t * (1.0 - t) * val1 + t * t * val2;
			return res;
		};
		for (let i = 0; i <= nbPoints; i++) {
			bez.push(new Vector3(
				equation(i / nbPoints, v0.x, v1.x, v2.x),
				equation(i / nbPoints, v0.y, v1.y, v2.y),
				equation(i / nbPoints, v0.z, v1.z, v2.z)));
		}
		return new Curve3(bez);
	}

	/**
	 * Returns a Curve3 object along a Cubic Bezier curve :
	 * http://doc.babylonjs.com/tutorials/How_to_use_Curve3#cubic-bezier-curve
	 * @param v0 (Vector3) the origin point of the Cubic Bezier
	 * @param v1 (Vector3) the first control point
	 * @param v2 (Vector3) the second control point
	 * @param v3 (Vector3) the end point of the Cubic Bezier
	 * @param nbPoints (integer) the wanted number of points in the curve
	 * @returns the created Curve3
	 */
	public static CreateCubicBezier(v0: Vector3, v1: Vector3, v2: Vector3, v3: Vector3, nbPoints: number): Curve3 {
		nbPoints = nbPoints > 3 ? nbPoints : 4;
		const bez = new Array<Vector3>();
		const equation = (t: number, val0: number, val1: number, val2: number, val3: number) => {
			const res = (1.0 - t) * (1.0 - t) * (1.0 - t) * val0 + 3.0 * t * (1.0 - t) * (1.0 - t)
				* val1 + 3.0 * t * t * (1.0 - t) * val2 + t * t * t * val3;
			return res;
		};
		for (let i = 0; i <= nbPoints; i++) {
			bez.push(new Vector3(
				equation(i / nbPoints, v0.x, v1.x, v2.x, v3.x),
				equation(i / nbPoints, v0.y, v1.y, v2.y, v3.y),
				equation(i / nbPoints, v0.z, v1.z, v2.z, v3.z)));
		}
		return new Curve3(bez);
	}

	/**
	 * Returns a Curve3 object along a Hermite Spline curve :
	 * http://doc.babylonjs.com/tutorials/How_to_use_Curve3#hermite-spline
	 * @param p1 (Vector3) the origin point of the Hermite Spline
	 * @param t1 (Vector3) the tangent vector at the origin point
	 * @param p2 (Vector3) the end point of the Hermite Spline
	 * @param t2 (Vector3) the tangent vector at the end point
	 * @param nbPoints (integer) the wanted number of points in the curve
	 * @returns the created Curve3
	 */
	public static CreateHermiteSpline(p1: Vector3, t1: Vector3, p2: Vector3, t2: Vector3, nbPoints: number): Curve3 {
		const hermite = new Array<Vector3>();
		const step = 1.0 / nbPoints;
		for (let i = 0; i <= nbPoints; i++) {
			hermite.push(Vector3.Hermite(p1, t1, p2, t2, i * step));
		}
		return new Curve3(hermite);
	}

	/**
	 * Returns a Curve3 object along a CatmullRom Spline curve :
	 * @param points (array of Vector3) the points the spline must pass through. At least, four points required
	 * @param nbPoints (integer) the wanted number of points between each curve control points
	 * @param closed (boolean) optional with default false, when true forms a closed loop from the points
	 * @returns the created Curve3
	 */
	public static CreateCatmullRomSpline(points: Vector3[], nbPoints: number, closed?: boolean): Curve3 {
		const catmullRom = new Array<Vector3>();
		const step = 1.0 / nbPoints;
		let amount = 0.0;
		if (closed) {
			const pointsCount = points.length;
			// tslint:disable-next-line:no-var-keyword
			for (var i = 0; i < pointsCount; i++) {
				amount = 0;
				for (let c = 0; c < nbPoints; c++) {
					catmullRom.push(Vector3.CatmullRom(
						points[i % pointsCount],
						points[(i + 1) % pointsCount],
						points[(i + 2) % pointsCount],
						points[(i + 3) % pointsCount], amount));
					amount += step;
				}
			}
			catmullRom.push(catmullRom[0]);
		} else {
			const totalPoints = new Array<Vector3>();
			totalPoints.push(points[0].clone());
			Array.prototype.push.apply(totalPoints, points);
			totalPoints.push(points[points.length - 1].clone());
			for (i = 0; i < totalPoints.length - 3; i++) {
				amount = 0;
				for (let c = 0; c < nbPoints; c++) {
					catmullRom.push(Vector3.CatmullRom(
						totalPoints[i],
						totalPoints[i + 1],
						totalPoints[i + 2],
						totalPoints[i + 3], amount));
					amount += step;
				}
			}
			i--;
			catmullRom.push(Vector3.CatmullRom(
				totalPoints[i],
				totalPoints[i + 1],
				totalPoints[i + 2],
				totalPoints[i + 3], amount));
		}
		return new Curve3(catmullRom);
	}

	/**
	 * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
	 * A Curve3 is designed from a series of successive Vector3.
	 * Tuto : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#curve3-object
	 * @param points points which make up the curve
	 */
	constructor(points: Vector3[]) {
		this._points = points;
		this._length = this._computeLength(points);
	}

	/**
	 * @returns the Curve3 stored array of successive Vector3
	 */
	public get points() {
		return this._points;
	}

	/**
	 * @returns the computed length (float) of the curve.
	 */
	public get length() {
		return this._length;
	}

	/**
	 * Returns a new instance of Curve3 object : const curve = curveA.continue(curveB);
	 * This new Curve3 is built by translating and sticking the curveB at the end of the curveA.
	 * curveA and curveB keep unchanged.
	 * @param curve the curve to continue from this curve
	 * @returns the newly constructed curve
	 */
	public continue(curve: Curve3): Curve3 {
		const lastPoint = this._points[this._points.length - 1];
		const continuedPoints = this._points.slice();
		const curvePoints = curve.points;
		for (let i = 1; i < curvePoints.length; i++) {
			continuedPoints.push(curvePoints[i].subtract(curvePoints[0]).add(lastPoint));
		}
		const continuedCurve = new Curve3(continuedPoints);
		return continuedCurve;
	}

	private _computeLength(path: Vector3[]): number {
		let l = 0;
		for (let i = 1; i < path.length; i++) {
			l += (path[i].subtract(path[i - 1])).length();
		}
		return l;
	}
}
