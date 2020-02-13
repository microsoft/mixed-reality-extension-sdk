/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/* eslint-disable max-classes-per-file */

import {
	Color3,
	Color4,
	Quaternion,
	Vector2,
	Vector3,
} from '..';

/** The names of types that support animation */
export enum AnimatibleName {
	Actor = 'actor',
	Animation = 'animation',
	Material = 'material'
}

/** The types that are acceptable targets of animations. */
export type AnimationProp = Vector2 | Vector3 | Quaternion | Color3 | Color4 | number | string | boolean;

/** A reference to a property on an object. Do not create these directly, but instead call [[ActorPath]]. */
export abstract class TargetPath<T extends AnimationProp> {
	public constructor(protected id: string) { }
	public toJSON() { return this.toString(); }
	public toString() { return this.id; }
	public get baseType() {
		if (this.id.startsWith('actor')) {
			return AnimatibleName.Actor;
		} else if (this.id.startsWith('animation')) {
			return AnimatibleName.Animation;
		} else if (this.id.startsWith('material')) {
			return AnimatibleName.Material;
		} else {
			throw new Error(`Target path ${this.id} doesn't target a valid object!`);
		}
	}
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

class ScaledTransformTargetPath extends TargetPath<never> {
	public get position() { return new Vector3TargetPath(this.id + '/position'); }
	public get rotation() { return new QuaternionTargetPath(this.id + '/rotation'); }
	public get scale() { return new Vector3TargetPath(this.id + '/scale'); }
}

class ActorTransformTargetPath extends TargetPath<never> {
	public get local() { return new TransformTargetPath(this.id + '/local'); }
	public get app() { return new ScaledTransformTargetPath(this.id + '/app'); }
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
