/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MeshPrimitive, Vertex } from '..';
import { Vector2, Vector3 } from '@microsoft/mixed-reality-extension-sdk';

/**
 * A MeshPrimitive prepopulated with sphere vertices and triangles
 */
export class Sphere extends MeshPrimitive {

    /**
     * Generate a sphere mesh primitive
     * @param radius The radius of the generated sphere
     * @param longLines The number of polar vertex rings
     * @param latLines The number of equatorial vertex rings (not counting poles)
     */
    public constructor(radius: number, longLines = 12, latLines = 8) {
        super();

        // generate north pole
        const north = new Vertex({
            position: new Vector3(0, radius, 0),
            normal: new Vector3(0, 1, 0),
            texCoord0: new Vector2(0.5, 1)
        });
        this.vertices.push(north);

        const longAngle = 2 * Math.PI / longLines,
            latAngle = Math.PI / latLines;

        // generate verts in rings starting from the north pole
        for (let lat = latAngle; lat < Math.PI - 0.001; lat += latAngle) {
            const ringStart = this.vertices.length;
            for (let long = 0; long < 2 * Math.PI + 0.001; long += longAngle) {

                // generate a vertex
                const normal = new Vector3(Math.sin(lat) * Math.cos(long), Math.cos(lat), Math.sin(lat) * Math.sin(long))
                const vert = new Vertex({
                    position: normal.scale(radius),
                    normal: normal,
                    texCoord0: new Vector2(1 - long / (2 * Math.PI), lat / Math.PI)
                });

                // get the indices of the neighboring verts
                const i = this.vertices.push(vert) - 1,
                    longNbr = i - 1 + (i == ringStart ? longLines + 1 : 0),
                    latNbr = i <= longLines + 1 ? 0 : i - longLines - 1,
                    latLongNbr = longNbr - longLines - 1;

                // fill in the tri/quad connecting this vert to the sphereA
                this.triangles.push(i, longNbr, latNbr);
                if (latLongNbr > 0)
                    this.triangles.push(longNbr, latLongNbr, latNbr);
            }
        }

        // generate south pole
        const south = new Vertex({
            position: new Vector3(0, -radius, 0),
            normal: new Vector3(0, -1, 0),
            texCoord0: new Vector2(0.5, 0)
        });
        const southIdx = this.vertices.push(south) - 1;

        // connect last long ring to the south pole
        const ringStart = southIdx - longLines - 1;
        for (let i = southIdx - longLines - 1; i < southIdx; i++) {
            const longNbr = i - 1 + (i == ringStart ? longLines + 1 : 0);
            this.triangles.push(longNbr, i, southIdx);
        }
    }
}
