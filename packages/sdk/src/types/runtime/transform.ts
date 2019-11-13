/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Quaternion, QuaternionLike, Vector3, Vector3Like } from '../..';

export interface TransformLike {
	position: Partial<Vector3Like>;
	rotation: Partial<QuaternionLike>;
}

export interface ScaledTransformLike extends TransformLike {
	scale: Partial<Vector3Like>;
}

export class Transform implements TransformLike {
	private _position: Vector3;
	private _rotation: Quaternion;

	public get position() { return this._position; }
	public set position(value: Vector3) { this._position.copy(value); }
	public get rotation() { return this._rotation; }
	public set rotation(value: Quaternion) { this._rotation.copy(value); }

	/**
	 * PUBLIC METHODS
	 */

	constructor() {
		this._position = Vector3.Zero();
		this._rotation = Quaternion.Identity();
	}

	public copy(from: Partial<TransformLike>): this {
		if (!from) { return this; }
		if (from.position !== undefined) { this.position.copy(from.position); }
		if (from.rotation !== undefined) { this.rotation.copy(from.rotation); }

		return this;
	}

	public toJSON() {
		return {
			position: this.position.toJSON(),
			rotation: this.rotation.toJSON(),
		} as TransformLike;
	}
}

export class ScaledTransform extends Transform implements ScaledTransformLike {
	private _scale: Vector3;

	public get scale() { return this._scale; }
	public set scale(value: Vector3) { this._scale.copy(value); }

	constructor() {
		super();
		this._scale = Vector3.One();
	}

	public copy(from: Partial<ScaledTransformLike>): this {
		super.copy(from);
		if (from.scale !== undefined) { this.scale.copy(from.scale); }
		return this;
	}

	public toJSON() {
		return {
			...super.toJSON(),
			scale: this.scale.toJSON(),
		} as ScaledTransformLike;
	}
}
