/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/* eslint-disable max-classes-per-file */

import {
	getAnimatibleNameFromTargetPath,
	Color3,
	Color4,
	Quaternion,
	Vector2,
	Vector3,
} from '..';

/** The types that are acceptable targets of animations. */
export type AnimationProp = Vector2 | Vector3 | Quaternion | Color3 | Color4 | number | string | boolean;

/** A reference to a property on an object. Do not create these directly, but instead call [[ActorPath]]. */
export abstract class TargetPath<T extends AnimationProp> {
	public constructor(protected id: string) { }
	public toJSON() { return this.toString(); }
	public toString() { return this.id; }
	public get baseType() { return getAnimatibleNameFromTargetPath(this.id); }
	public get baseName() {
		const baseObj = this.id.split('/')[0];
		const name = baseObj.split(':')[1];
		return name;
	}
}

class NumberTargetPath extends TargetPath<number> { }

class Vector3TargetPath extends TargetPath<Vector3> {
	public get x() { return new NumberTargetPath(this.id + '/x'); }
	public get y() { return new NumberTargetPath(this.id + '/y'); }
	public get z() { return new NumberTargetPath(this.id + '/z'); }
}

class QuaternionTargetPath extends TargetPath<Quaternion> { }

class TransformTargetPath extends TargetPath<never> {
	public get position() { return new Vector3TargetPath(this.id + '/position'); }
	public get rotation() { return new QuaternionTargetPath(this.id + '/rotation'); }
}

class ScaledTransformTargetPath extends TransformTargetPath {
	public get scale() { return new Vector3TargetPath(this.id + '/scale'); }
}

class ActorTransformTargetPath extends TargetPath<never> {
	public get local() { return new ScaledTransformTargetPath(this.id + '/local'); }
	public get app() { return new TransformTargetPath(this.id + '/app'); }
}

class ActorTargetPath extends TargetPath<never> {
	public get transform() { return new ActorTransformTargetPath(this.id + '/transform'); }
}

/**
 * Create a reference to a generic actor's property
 * @param placeholder The placeholder name of the targetable object that will be bound later.
 */
export function ActorPath(placeholder: string) {
	return new ActorTargetPath(`actor:${placeholder}`);
}
