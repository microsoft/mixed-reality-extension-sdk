/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetContainer, AssetLike } from '.';
import { Actor } from '..';
import { InternalAsset } from '../../internal/asset';
import { Patchable } from '../../patchable';

export interface PrefabLike {
	/** The number of actors this prefab contains. */
	actorCount: number;
}

export class Prefab extends Asset implements PrefabLike, Patchable<AssetLike> {
	private _actorCount: number;
	private _internal = new InternalAsset(this);

	/** @hidden */
	public get internal() { return this._internal; }

	/** @inheritdoc */
	public get actorCount() { return this._actorCount; }

	/** @inheritdoc */
	public get prefab(): Prefab { return this; }

	/** @hidden */
	public constructor(container: AssetContainer, def: AssetLike) {
		super(container, def);

		if (!def.prefab) {
			throw new Error("Cannot construct prefab from non-prefab definition");
		}

		this.copy(def);
	}

	public copy(from: Partial<AssetLike>): this {
		if (!from) {
			return this;
		}

		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		super.copy(from);
		if (from.prefab) {
			this._actorCount = from.prefab.actorCount;
		}

		this.internal.observing = wasObserving;
		return this;
	}

	/** @hidden */
	public toJSON(): AssetLike {
		return {
			...super.toJSON(),
			prefab: {
				actorCount: this._actorCount
			}
		};
	}

	/** @hidden */
	public breakReference(ref: Actor | Asset) {
		if (!(ref instanceof Actor)) { return; }
	}
}
