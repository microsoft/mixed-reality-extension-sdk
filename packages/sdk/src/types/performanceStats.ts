/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * A snapshot of various stats useful for debugging and benchmarking. None of these correlate exactly with
 * a particular client's experience, framerate, memory usage, etc., but should be generally indicative.
 */
export type PerformanceStats = {
	/** The number of actors in the scene. */
	actorCount: number;
	/**
	 * The number of visible actors with meshes assigned, not including library actors. For a mobile Altspace user with
	 * only one MRE running, this should generally be kept below 60, though higher can be done with judicious
	 * use of mesh/material reuse and instancing.
	 */
	actorWithMeshCount: number;

	/** The number of loaded prefab assets. */
	prefabCount: number;

	/** The number of loaded material assets. */
	materialCount: number;

	/** The number of loaded texture assets. */
	textureCount: number;
	/**
	 * The total number of pixels of all loaded textures. Corresponds to GPU memory usage. Should be kept below
	 * 6 000 000 for mobile device clients.
	 */
	texturePixelsTotal: number;
	/**
	 * [[texturePixelsTotal]] divided by [[textureCount]]. If this value exceeds 1024 * 1024 (roughly 1 000 000),
	 * clients may experience frame drops during loading.
	 */
	texturePixelsAverage: number;

	/** The number of loaded mesh assets. */
	meshCount: number;
	/** The total number of vertices of all loaded meshes. Corresponds to GPU memory usage. */
	meshVerticesTotal: number;
	/** The total number of polygons of all loaded meshes. */
	meshTrianglesTotal: number;

	/** The number of loaded sound assets. */
	soundCount: number;
	/** The total number of seconds of loaded audio. */
	soundSecondsTotal: number;

	/**
	 * The average incoming bandwidth of this app over the last 1/5/30 seconds, in KB/s. This is roughly equivalent
	 * to the bandwidth sent by the busiest client over the interval, though does not correlate exactly.
	 * Only MRE internal traffic is counted, not general HTTP requests (static file hosting, etc.).
	 */
	networkBandwidthIn: [number, number, number];
	/**
	 * The average outgoing bandwidth of this app over the last 1/5/30 seconds, in KB/s. This is roughly equivalent
	 * to the bandwidth sent to the busiest client over the interval, though this does not correlate exactly.
	 * Only MRE internal traffic is counted, not general HTTP requests (static file hosting, etc.).
	 */
	networkBandwidthOut: [number, number, number];
	/**
	 * The number of messages sent and received by this app in the last 1/5/30 seconds. A high number might indicate
	 * that clients are wasting CPU cycles serializing and deserializing messages.
	 */
	networkMessageCount: [number, number, number];
}
