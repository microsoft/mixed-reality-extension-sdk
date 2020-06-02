/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { readFileSync, statSync } from 'fs';
import { lookup as MimeLookup } from 'mime-types';
import GLTF from './gen/gltf';
import { Serializable } from './serializable';

export interface ImageLike {
	name?: string;
	uri?: string;
	embeddedFilePath?: string;
	embeddedData?: Buffer;
	mimeType?: string;
}

export class Image extends Serializable implements ImageLike {

	public name: string;

	/**
	 * A URI to a texture, resolved by the model consumer. Don't set alongside [[embeddedFilePath]] or [[embeddedData]].
	 */
	public uri: string;

	/**
	 * A path to a local texture file, resolved during serialization and packed into the model.
	 * Don't set alongside [[uri]] or [[embeddedData]].
	 */
	public embeddedFilePath: string;
	private embeddedFileSize: number;

	/**
	 * The image's binary data. Don't set alongside [[uri]] or [[embeddedFilePath]].
	 */
	public embeddedData: Buffer;

	private manualMime: string;

	/**
	 * The image's MIME type. If omitted, will be detected from file extension.
	 */
	public get mimeType(): string {
		if (this.manualMime !== undefined) {
			return this.manualMime;
		} else if (this.embeddedFilePath !== undefined) {
			return MimeLookup(this.embeddedFilePath) || 'application/octet-stream';
		} else if (this.uri !== undefined) {
			return MimeLookup(this.uri) || 'application/octet-stream';
		}
	}

	public set mimeType(type: string) {
		this.manualMime = type;
	}

	constructor(init: ImageLike = {}) {
		super();
		this.name = init.name;
		this.uri = init.uri;
		this.embeddedFilePath = init.embeddedFilePath;
		this.embeddedData = init.embeddedData;
		this.mimeType = init.mimeType;
	}

	public serialize(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
		if (this.cachedSerialId !== undefined) {
			return this.cachedSerialId;
		}

		const image: GLTF.Image = {
			name: this.name,
			uri: this.uri,
			mimeType: this.mimeType
		};

		if (this.embeddedFilePath || this.embeddedData) {
			image.bufferView = this._embedImage(document, data);
		}

		if (!document.images) {
			document.images = [];
		}
		document.images.push(image);

		return this.cachedSerialId = document.images.length - 1;
	}

	private _embedImage(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
		let lastBV: GLTF.BufferView;
		if (document.bufferViews.length > 0) {
			lastBV = document.bufferViews[document.bufferViews.length - 1];
		}

		const bufferView: GLTF.BufferView = {
			buffer: 0,
			byteOffset: lastBV ? Math.ceil((lastBV.byteOffset + lastBV.byteLength) / 4) * 4 : 0,
			byteLength: this.embeddedData ? this.embeddedData.length : this.embeddedFileSize
		};

		const bufferViewData = data.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);

		if (this.embeddedData) {
			this.embeddedData.copy(bufferViewData);
		} else {
			readFileSync(this.embeddedFilePath).copy(bufferViewData);
		}

		if (!document.bufferViews) {
			document.bufferViews = [];
		}
		document.bufferViews.push(bufferView);

		return document.bufferViews.length - 1;
	}

	public getByteSize(scanId: number): number {
		if (this.scanList.includes(scanId)) {
			return 0;
		} else {
			this.scanList.push(scanId);
		}

		if (this.embeddedFilePath) {
			const stat = statSync(this.embeddedFilePath);
			return this.embeddedFileSize = stat.size;
		} else if (this.embeddedData) {
			return this.embeddedData.length;
		} else {
			return 0;
		}
	}
}
