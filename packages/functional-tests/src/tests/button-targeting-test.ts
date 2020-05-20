/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import { Vector3Like } from '@microsoft/mixed-reality-extension-sdk';

export default class ButtonTargetingTest extends Test {
    public expectedResultDescription = "Draw on the surface to place red ink";

    private drawSurface: MRE.Actor;
    private eraseButton: MRE.Actor;
    private surfaceBehavior: MRE.ButtonBehavior;
    private assets: MRE.AssetContainer;
    private drawMesh: MRE.Mesh;
    private hoverMaterial: MRE.Material;
    private drawMaterial: MRE.Material;
    private drawObjects: MRE.Actor[] = [];

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
        this.assets = new MRE.AssetContainer(this.app.context);
        
        this.drawMesh = this.assets.createSphereMesh('drawPoint', .01);
        this.hoverMaterial = this.assets.createMaterial('hoverMaterial', {
            color: MRE.Color3.Gray()
        });
        this.drawMaterial = this.assets.createMaterial('drawMaterial', {
            color: MRE.Color3.Red()
        })

        this.createDrawSurface(root);
        this.createEraseButton();

        // Create scene light
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: "Light",
				parentId: root.id,
				light: {
					type: 'point',
					range: 5,
					intensity: 2,
					color: { r: 1, g: 0.5, b: 0.3 }
				},
				transform: {
					local: {
						position: { x: -2, y: 2, z: -2 }
					}
				}
			}
        });

		await this.stoppedAsync();
		return true;
	}

	private spawnTargetObjects(targetingState: 'hover' | 'draw', drawPoints: Vector3Like[]) {
        const materialId = (targetingState === 'hover') ? this.hoverMaterial.id : this.drawMaterial.id;

        const drawActors = drawPoints.map(drawPoint => {
            return MRE.Actor.Create(this.app.context, {
                actor: {
                    name: targetingState === 'hover' ? 'hoverBall' : 'drawBall',
                    parentId: this.drawSurface.id,
                    transform: { local: { position: drawPoint } },
                    appearance: {
                        materialId: materialId,
                        meshId: this.drawMesh.id
                    }
                }
            });
        });

        if (targetingState === 'hover') {
            // Set lifetime timer for the hover points.
            setTimeout(() => drawActors.forEach(actor => actor.destroy()), 1500);
        } else {
            this.drawObjects = this.drawObjects.concat(drawActors);
        }
    }

    private eraseDrawObjects() {
        this.drawObjects.forEach(actor => actor.destroy());
        this.drawObjects = [];
    }

    private createDrawSurface(root: MRE.Actor) {
        const surfaceMesh = this.assets.createBoxMesh('drawSurface', 2, 1, .01);

        // Create draw surface
        this.drawSurface = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'drawSurface',
				parentId: root.id,
				transform: { local: { position: { y: 1.2 } } },
				appearance: { meshId: surfaceMesh.id },
				collider: { geometry: { shape: MRE.ColliderType.Auto} }
			}
        });
        
        // Create label for draw surface.
        MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: this.drawSurface.id,
				transform: { local: { position: { y: 0.1 } } },
				text: {
					contents: 'Use surface to hove and draw over',
					height: 0.1,
					anchor: MRE.TextAnchorLocation.BottomCenter,
					color: MRE.Color3.Teal()
				}
			}
        });

        this.surfaceBehavior = this.drawSurface.setBehavior(MRE.ButtonBehavior);
        
        // Hover handlers
        this.surfaceBehavior.onHover('enter', (_, data: MRE.ButtonEventData) => {
            this.spawnTargetObjects('hover', data.targetedPoints.map(pointData => pointData.localSpacePoint));
        });
        this.surfaceBehavior.onHover('hovering', (_, data) => {
            this.spawnTargetObjects('hover', data.targetedPoints.map(pointData => pointData.localSpacePoint));
        });
        this.surfaceBehavior.onHover('exit', (_, data: MRE.ButtonEventData) => {
            this.spawnTargetObjects('hover', data.targetedPoints.map(pointData => pointData.localSpacePoint));
        });

        // Button handlers
        this.surfaceBehavior.onButton('pressed', (_, data: MRE.ButtonEventData) => {
            this.spawnTargetObjects('draw', data.targetedPoints.map(pointData => pointData.localSpacePoint));
        });
        this.surfaceBehavior.onButton('holding', (_, data) => {
            this.spawnTargetObjects('draw', data.targetedPoints.map(pointData => pointData.localSpacePoint));
        });
        this.surfaceBehavior.onButton('released', (_, data: MRE.ButtonEventData) => {
            this.spawnTargetObjects('draw', data.targetedPoints.map(pointData => pointData.localSpacePoint));
        });
    }

    private createEraseButton() {
        // Create erase button for the surface
        const buttonMesh = this.assets.createBoxMesh('eraseButton', .2, .2, .01);
        this.eraseButton = MRE.Actor.Create(this.app.context, {
            actor: {
                name: 'eraseButton',
                parentId: this.drawSurface.id,
                transform: { local: { position: { y: -.7 } } },
                appearance: { meshId: buttonMesh.id },
                collider: { geometry: { shape: MRE.ColliderType.Auto } }
            }
        });
        MRE.Actor.Create(this.app.context, {
            actor: {
                name: 'eraseButtonLabel',
                parentId: this.eraseButton.id,
                transform: { local: { position: { y: -.3 } } },
                text: {
                    contents: "Click Button to Erase Surface",
                    height: .1,
                    anchor: MRE.TextAnchorLocation.BottomCenter,
                    color: MRE.Color3.Teal()
                }
            }
        })

        const eraseButtonBehavior = this.eraseButton.setBehavior(MRE.ButtonBehavior);
        eraseButtonBehavior.onClick((_, __) => this.eraseDrawObjects());
    }
}
