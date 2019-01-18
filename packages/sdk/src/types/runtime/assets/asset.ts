/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AssetManager, Material, MaterialLike, Mesh, MeshLike, Prefab, PrefabLike, Texture, TextureLike } from '.';

/**
 * Instructions for how to load an asset.
 */
export interface AssetSource {
    /**
     * The format of the asset container.
     */
    containerType: 'gltf' | 'library';

    /**
     * The URI at which the asset container can be found.
     */
    uri?: string;

    /**
     * A designator for which asset in the container this is. Format will be different for each container type.
     * For example, a glTF's third material would have "materials/2" as its internalId.
     */
    internalId?: string;
}

export interface AssetLike {
    /**
     * The unique id of this asset. Use this to reference this asset in actors, etc.
     */
    id: string;
    /**
     * A human-readable string identifying the asset. Not required to be unique, but
     * can be referenced by name if it is.
     */
    name?: string;
    /**
     * Where this asset came from. Used for loading on late-joining clients.
     */
    source?: AssetSource;

    /** Only populated when this asset is a prefab. An asset will have only one of these types specified. */
    prefab?: PrefabLike;
    /** Only populated when this asset is a mesh. An asset will have only one of these types specified. */
    mesh?: MeshLike;
    /** Only populated when this asset is a material. An asset will have only one of these types specified. */
    material?: MaterialLike;
    /** Only populated when this asset is a texture. An asset will have only one of these types specified. */
    texture?: TextureLike;
}

/** The base class for all asset types. */
export class Asset implements AssetLike {
    // tslint:disable:variable-name
    private _id: string;
    private _name: string;
    private _source: AssetSource;
    // tslint:enable:variable-name

    /** @inheritdoc */
    public get id() { return this._id; }

    /** @inheritdoc */
    public get name() { return this._name; }

    /** @inheritdoc */
    public get source() { return this._source; }

    protected constructor(public manager: AssetManager, def: AssetLike) {
        this._id = def.id;
        this._name = def.name;
        this._source = def.source;
    }

    /** @hidden */
    protected toJSON(): AssetLike {
        return {
            id: this._id,
            name: this._name,
            source: this._source
        };
    }

    /** @hidden */
    protected copy(from: Partial<AssetLike>): void {
        // tslint:disable:curly
        if (from.id) this._id = from.id;
        if (from.name) this._name = from.name;
        if (from.source) this._source = from.source;
        // tslint:enable:curly
    }

    /** @hidden */
    public static Parse(manager: AssetManager, def: AssetLike): Asset {
        if (def.prefab) {
            return new Prefab(manager, def);
        } else if (def.mesh) {
            return new Mesh(manager, def);
        } else if (def.material) {
            return new Material(manager, def);
        } else if (def.texture) {
            return new Texture(manager, def);
        } else {
            throw new Error(`Asset ${def.id} is not of a known type.`);
        }
    }
}
