/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Material, MeshPrimitive, Vertex } from '..';
import { Curve3, Path3, Vector2, Vector3 } from '@microsoft/mixed-reality-extension-common';

/** How a [[Tube]] should be capped. */
export enum TubeCapType {
	/** No caps. */
	NoCap = 0,
	/** Cap on the start only. */
	CapStart,
	/** Cap on the end only. */
	CapEnd,
	/** Caps on both ends. */
	CapAll
}

/** Arguments to the [[Tube]] constructor. */
export type TubeParams = {
	/** A required array of successive Vector3s. It is the curve used as the axis of the tube. */
	path: Vector3[];
	/** The tube radius. Defaults to 1. */
	radius?: number;
	/** The number of sides on the tubular surface (positive integer). Defaults to 24. */
	tesselation?: number;
	/**
	 * If provided, overrides the [[radius]] argument. This function is called on each point of the tube path
	 * and is passed the index `i` of the i-th point, and the distance of this point from the first point of the path.
	 * It must return a radius value (positive float).
	 */
	radiusFunction?: (i: number, distance: number) => number;
	/** Sets the way the tube is capped. Defaults to [[TubeCapType.NoCap]]. */
	cap?: TubeCapType;
	/** An initial material to apply to the tube. */
	material?: Material;
};

/**
 * A MeshPrimitive in the shape of a tube.
 */
export class Tube extends MeshPrimitive {

	/**
	 * Generate a tube mesh primitive.
	 * @param options How the tube should be configured.
	 */
	public constructor(options: TubeParams) {
		super({material: options.material});

	}

	/*public static CreateTube(name: string, options: { path: Vector3[], radius?: number, tessellation?: number, radiusFunction?: { (i: number, distance: number): number; },
		cap?: number, arc?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, instance?: Mesh, invertUV?: boolean },
		scene: Nullable<Scene> = null): Mesh {
        var path = options.path;
        var instance = options.instance;
        var radius = 1.0;

        if (options.radius !== undefined) {
            radius = options.radius;
        } else if (instance) {
            radius = instance._creationDataStorage!.radius;
        }

        var tessellation = options.tessellation || 64 | 0;
        var radiusFunction = options.radiusFunction || null;
        var cap = options.cap || Mesh.NO_CAP;
        var invertUV = options.invertUV || false;
        var updatable = options.updatable;
        var sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        options.arc = options.arc && (options.arc <= 0.0 || options.arc > 1.0) ? 1.0 : options.arc || 1.0;

        // tube geometry
        var tubePathArray = (path: Vector3[], path3D: Path3D, circlePaths: Vector3[][], radius: number, tessellation: number,
            radiusFunction: Nullable<{ (i: number, distance: number): number; }>, cap: number, arc: number) => {
            var tangents = path3D.getTangents();
            var normals = path3D.getNormals();
            var distances = path3D.getDistances();
            var pi2 = Math.PI * 2;
            var step = pi2 / tessellation * arc;
            var returnRadius: { (i: number, distance: number): number; } = () => radius;
            var radiusFunctionFinal: { (i: number, distance: number): number; } = radiusFunction || returnRadius;

            var circlePath: Vector3[];
            var rad: number;
            var normal: Vector3;
            var rotated: Vector3;
            var rotationMatrix: Matrix = TmpVectors.Matrix[0];
            var index = (cap === Mesh.NO_CAP || cap === Mesh.CAP_END) ? 0 : 2;
            for (var i = 0; i < path.length; i++) {
                rad = radiusFunctionFinal(i, distances[i]); // current radius
                circlePath = Array<Vector3>();              // current circle array
                normal = normals[i];                        // current normal
                for (var t = 0; t < tessellation; t++) {
                    Matrix.RotationAxisToRef(tangents[i], step * t, rotationMatrix);
                    rotated = circlePath[t] ? circlePath[t] : Vector3.Zero();
                    Vector3.TransformCoordinatesToRef(normal, rotationMatrix, rotated);
                    rotated.scaleInPlace(rad).addInPlace(path[i]);
                    circlePath[t] = rotated;
                }
                circlePaths[index] = circlePath;
                index++;
            }
            // cap
            var capPath = (nbPoints: number, pathIndex: number): Array<Vector3> => {
                var pointCap = Array<Vector3>();
                for (var i = 0; i < nbPoints; i++) {
                    pointCap.push(path[pathIndex]);
                }
                return pointCap;
            };
            switch (cap) {
                case Mesh.NO_CAP:
                    break;
                case Mesh.CAP_START:
                    circlePaths[0] = capPath(tessellation, 0);
                    circlePaths[1] = circlePaths[2].slice(0);
                    break;
                case Mesh.CAP_END:
                    circlePaths[index] = circlePaths[index - 1].slice(0);
                    circlePaths[index + 1] = capPath(tessellation, path.length - 1);
                    break;
                case Mesh.CAP_ALL:
                    circlePaths[0] = capPath(tessellation, 0);
                    circlePaths[1] = circlePaths[2].slice(0);
                    circlePaths[index] = circlePaths[index - 1].slice(0);
                    circlePaths[index + 1] = capPath(tessellation, path.length - 1);
                    break;
                default:
                    break;
            }
            return circlePaths;
        };

        var path3D;
        var pathArray;
        if (instance) { // tube update
            let storage = instance._creationDataStorage!;
            var arc = options.arc || storage.arc;
            path3D = storage.path3D.update(path);
            pathArray = tubePathArray(path, path3D, storage.pathArray, radius, storage.tessellation, radiusFunction, storage.cap, arc);
            instance = RibbonBuilder.CreateRibbon("", { pathArray: pathArray, instance: instance });
            // Update mode, no need to recreate the storage.
            storage.path3D = path3D;
            storage.pathArray = pathArray;
            storage.arc = arc;
            storage.radius = radius;

            return instance;
        }

        // tube creation
        path3D = <any>new Path3D(path);
        var newPathArray = new Array<Array<Vector3>>();
        cap = (cap < 0 || cap > 3) ? 0 : cap;
        pathArray = tubePathArray(path, path3D, newPathArray, radius, tessellation, radiusFunction, cap, options.arc);
        var tube = RibbonBuilder.CreateRibbon(name, { pathArray: pathArray, closePath: true, closeArray: false, updatable: updatable, sideOrientation: sideOrientation, invertUV: invertUV, frontUVs: options.frontUVs, backUVs: options.backUVs }, scene);
        tube._creationDataStorage!.pathArray = pathArray;
        tube._creationDataStorage!.path3D = path3D;
        tube._creationDataStorage!.tessellation = tessellation;
        tube._creationDataStorage!.cap = cap;
        tube._creationDataStorage!.arc = options.arc;
        tube._creationDataStorage!.radius = radius;

        return tube;
    }*/
}
