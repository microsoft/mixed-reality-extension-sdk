/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	AnimationData, AnimationDataLike,
	Asset, AssetSource,
	Context,
	Guid, newGuid,
	log,
	Material, MaterialLike,
	Mesh,
	Prefab,
	PrimitiveDefinition,
	PrimitiveShape,
	ReadonlyMap,
	Sound, SoundLike,
	Texture, TextureLike,
	Vector3Like,
	VideoStream, VideoStreamLike
} from '..';
import {
	Payloads,
	resolveJsonValues
} from '../internal';

/**
 * The root object of the MRE SDK's asset system. Once you create an AssetContainer,
 * you can create new materials, textures, or sounds from scratch, or load glTF
 * files for their assets.
 */
export class AssetContainer {
	private _id: Guid;
	private _assets = new Map<Guid, Asset>();

	/** @hidden */
	public get id() { return this._id; }

	/** A mapping of asset IDs to assets in this container */
	public get assetsById() { return this._assets as ReadonlyMap<Guid, Asset>; }
	/** A list of all assets in this container */
	public get assets() { return [...this._assets.values()]; }
	/** A list of all animation data in this container */
	public get animationData() { return this.assets.filter(a => a instanceof AnimationData) as AnimationData[]; }
	/** A list of all materials in this container */
	public get materials() { return this.assets.filter(a => a instanceof Material) as Material[]; }
	/** A list of all meshes in this container */
	public get meshes() { return this.assets.filter(a => a instanceof Mesh) as Mesh[]; }
	/** A list of all prefabs in this container */
	public get prefabs() { return this.assets.filter(a => a instanceof Prefab) as Prefab[]; }
	/** A list of all sounds in this container */
	public get sounds() { return this.assets.filter(a => a instanceof Sound) as Sound[]; }
	/** A list of all textures in this container */
	public get textures() { return this.assets.filter(a => a instanceof Texture) as Texture[]; }

	/** Create a new asset container */
	public constructor(public context: Context) {
		this._id = newGuid();
		context.internal.assetContainers.add(this);
	}

	/**
	 * Generate a new material
	 * @param name The new material's name
	 * @param definition The initial material properties
	 */
	public createMaterial(name: string, definition: Partial<MaterialLike>): Material {
		const mat = new Material(this, {
			id: newGuid(),
			name,
			material: resolveJsonValues(definition)
		});
		mat.setLoadedPromise(this.sendCreateAsset(mat));
		return mat;
	}

	/**
	 * Load an image file and generate a new texture asset
	 * @param name The new texture's name
	 * @param definition The initial texture properties. The `uri` property is required.
	 */
	public createTexture(name: string, definition: Partial<TextureLike>): Texture {
		const tex = new Texture(this, {
			id: newGuid(),
			name,
			texture: resolveJsonValues(definition)
		});
		tex.setLoadedPromise(this.sendCreateAsset(tex));
		return tex;
	}

	/**
	 * Load an audio file and generate a new sound asset
	 * @param name The new sound's name
	 * @param definition The initial sound properties. The `uri` property is required.
	 */
	public createSound(name: string, definition: Partial<SoundLike>): Sound {
		const sound = new Sound(this, {
			id: newGuid(),
			name,
			sound: resolveJsonValues(definition)
		});
		sound.setLoadedPromise(this.sendCreateAsset(sound));
		return sound;
	}

	/**
	 * Preload a video stream and generate a new video stream asset
	 * @param name The new stream's name
	 * @param definition The initial video stream properties. The `uri` property is required.
	 */
	public createVideoStream(name: string, definition: Partial<VideoStreamLike>): VideoStream {
		const video = new VideoStream(this, {
			id: newGuid(),
			name,
			videoStream: resolveJsonValues(definition)
		});
		video.setLoadedPromise(this.sendCreateAsset(video));
		return video;
	}

	/**
	 * Preload unbound animation keyframe data for later use.
	 * @param name The name of this animation
	 * @param data The keyframe data
	 */
	public createAnimationData(name: string, data: AnimationDataLike) {
		const validationIssues = AnimationData.Validate(data);
		if (validationIssues) {
			throw new Error("Cannot create animation data from bad data:\n"
				+ validationIssues.map(s => '- ' + s).join('\n'));
		}

		const animData = new AnimationData(this, {
			id: newGuid(),
			name,
			animationData: data
		});
		animData.setLoadedPromise(this.sendCreateAsset(animData));
		return animData;
	}

	/**
	 * Create a new sphere-shaped mesh.
	 * @param name The name to give to the asset.
	 * @param radius The radius of the sphere.
	 * @param uSegments The number of longitudinal segments.
	 * @param vSegments The number of latitudinal segments.
	 */
	public createSphereMesh(name: string, radius: number, uSegments = 36, vSegments = 18): Mesh {
		return this.createPrimitiveMesh(name, {
			shape: PrimitiveShape.Sphere,
			dimensions: { x: 2 * radius, y: 2 * radius, z: 2 * radius },
			uSegments,
			vSegments
		});
	}

	/**
	 * Create a new box-shaped mesh.
	 * @param name The name to give to the asset.
	 * @param width The length of the box on the X axis.
	 * @param height The length of the box on the Y axis.
	 * @param depth The length of the box on the Z axis.
	 */
	public createBoxMesh(name: string, width: number, height: number, depth: number): Mesh {
		return this.createPrimitiveMesh(name, {
			shape: PrimitiveShape.Box,
			dimensions: { x: width, y: height, z: depth }
		});
	}

	/**
	 * Create a new capsule-shaped mesh.
	 * @param name The name to give to the asset.
	 * @param height The height of the capsule from tip to tip.
	 * @param radius The thickness of the capsule.
	 * @param direction The long axis of the capsule.
	 * @param uSegments The number of longitudinal segments.
	 * @param vSegments The number of latitudinal segments.
	 */
	public createCapsuleMesh(
		name: string, height: number, radius: number,
		direction: 'x' | 'y' | 'z' = 'y', uSegments = 36, vSegments = 18
	): Mesh {
		if (height < 2 * radius) {
			throw new Error("Capsule height must be greater than twice the radius");
		}

		const dimensions = { x: 2 * radius, y: 2 * radius, z: 2 * radius } as Vector3Like;
		dimensions[direction] = height;
		return this.createPrimitiveMesh(name, {
			shape: PrimitiveShape.Capsule,
			dimensions,
			uSegments,
			vSegments
		});
	}

	/**
	 * Create a new cylinder-shaped mesh.
	 * @param name The name to give to the asset.
	 * @param height The height of the cylinder.
	 * @param radius The thickness of the cylinder.
	 * @param direction The long axis of the cylinder.
	 * @param uSegments The number of longitudinal segments.
	 */
	public createCylinderMesh(
		name: string, height: number, radius: number,
		direction: 'x' | 'y' | 'z' = 'y', uSegments = 36
	): Mesh {
		const dimensions = { x: 2 * radius, y: 2 * radius, z: 2 * radius };
		dimensions[direction] = height;
		return this.createPrimitiveMesh(name, {
			shape: PrimitiveShape.Cylinder,
			dimensions,
			uSegments
		});
	}

	/**
	 * Create a flat mesh on the X-Z plane.
	 * @param name The name to give to the asset.
	 * @param width The X-axis length of the plane.
	 * @param height The Z-axis length of the plane.
	 * @param uSegments The number of X-axis segments.
	 * @param vSegments The number of Z-axis segments.
	 */
	public createPlaneMesh(name: string, width: number, height: number, uSegments = 1, vSegments = 1): Mesh {
		return this.createPrimitiveMesh(name, {
			shape: PrimitiveShape.Plane,
			dimensions: { x: width, y: 0, z: height },
			uSegments,
			vSegments
		});
	}

	/**
	 * Create a new mesh from the given primitive definition
	 * @param name The new mesh's name
	 * @param definition A description of the desired mesh
	 */
	public createPrimitiveMesh(name: string, definition: PrimitiveDefinition): Mesh {
		const mesh = new Mesh(this, {
			id: newGuid(),
			name,
			mesh: {
				primitiveDefinition: definition
			}
		});
		mesh.setLoadedPromise(this.sendCreateAsset(mesh));
		return mesh;
	}

	/**
	 * Load the assets in a glTF file by URL, and this container with the result.
	 * @param uri The URI to a glTF model.
	 * @param colliderType The shape of the generated prefab collider.
	 * @returns A promise that resolves with the list of loaded assets.
	 */
	public async loadGltf(uri: string, colliderType?: 'box' | 'mesh'): Promise<Asset[]> {
		if (!this._assets) {
			throw new Error("Cannot load new assets into an unloaded container!");
		}

		const source = {
			containerType: 'gltf',
			uri
		} as AssetSource;

		const payload = {
			type: 'load-assets',
			containerId: this.id,
			source,
			colliderType
		} as Payloads.LoadAssets;

		const response = await this.context.internal
			.sendPayloadAndGetReply<Payloads.LoadAssets, Payloads.AssetsLoaded>(payload);
		if (response.failureMessage) {
			throw new Error(response.failureMessage);
		}

		const newAssets: Asset[] = [];
		for (const def of response.assets) {
			def.source = source;
			const asset = Asset.Parse(this, def);
			this._assets.set(def.id, asset);
			newAssets.push(asset);
		}
		return newAssets;
	}

	/** Break references to all assets in the container, and unload them to free memory */
	public unload(): void {
		for (const a of this.assets) {
			a.breakAllReferences();
		}
		this.context.internal.assetContainers.delete(this);
		this._assets = null;

		// wait until after the unassignments get propagated to clients to avoid visually
		// missing textures (renders black) and missing materials (renders magenta)
		this.context.internal.nextUpdate().then(() => {
			this.context.internal.protocol.sendPayload({
				type: 'unload-assets',
				containerId: this.id
			} as Payloads.UnloadAssets);
		})
		.catch(err => log.error('app', err));
	}

	private async sendCreateAsset(asset: Asset): Promise<void> {
		if (!this._assets) {
			throw new Error("Cannot load new assets into an unloaded container!");
		}

		this._assets.set(asset.id, asset);

		const reply = await this.context.internal.sendPayloadAndGetReply<Payloads.CreateAsset, Payloads.AssetsLoaded>({
			type: 'create-asset',
			containerId: this.id,
			definition: resolveJsonValues(asset)
		});

		if (reply.failureMessage || reply.assets.length !== 1) {
			throw new Error(`Creation/Loading of asset ${asset.name} failed: ${reply.failureMessage}`);
		}

		asset.copy(reply.assets[0]);
	}
}
