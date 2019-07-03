/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Test } from '../test';

export default class AltspaceVRLibraryTest extends Test {
	public expectedResultDescription = "Altspace kit objects, teleporter to the Campfire";

	public async run(root: MRE.Actor): Promise<boolean> {
		// AltspaceVR resource IDs from https://account.altvr.com/kits/
		const libraryActors: Array<MRE.ForwardPromise<MRE.Actor>> = [];
		libraryActors.push(MRE.Actor.CreateFromLibrary(this.app.context, {
			resourceId: "artifact:993646440251130011",
			actor: {
				name: 'Campfire Kit: Cabin',
				parentId: root.id,
				transform: {
					local: {
						position: { x: 0, y: 0.0, z: -0.1 },
						rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Up(), -180.0 * MRE.DegreesToRadians),
						scale: { x: 0.08, y: 0.08, z: 0.08 }
					}
				}
			}
		}));
		libraryActors.push(MRE.Actor.CreateFromLibrary(this.app.context, {
			resourceId: "artifact:1031602421559722256",
			actor: {
				name: 'Home Kit: Chair 2',
				parentId: root.id,
				transform: {
					local: {
						position: { x: -1, y: 0.0, z: -1.5 },
						rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Up(), -45.0 * MRE.DegreesToRadians),
						scale: { x: 0.7, y: 0.7, z: 0.7 }
					}
				}
			}
		}));
		libraryActors.push(MRE.Actor.CreateFromLibrary(this.app.context, {
			resourceId: "artifact:1049499012731764738",
			actor: {
				name: 'Halloween Kit: Pumpkin Happy',
				parentId: root.id,
				transform: {
					local: {
						position: { x: 1, y: 0.0, z: -1.5 },
						scale: { x: 0.7, y: 0.7, z: 0.7 }
					}
				}
			}
		}));
		libraryActors.push(MRE.Actor.CreateFromLibrary(this.app.context, {
			resourceId: "artifact:995365722689372801",
			actor: {
				name: 'Alien Planet Kit: Island 06',
				parentId: root.id,
				transform: {
					local: {
						position: { x: 0, y: 0.0, z: -1.5 },
						scale: { x: 0.05, y: 0.05, z: 0.05 }
					}
				}
			}
		}));
		libraryActors.push(MRE.Actor.CreateFromLibrary(this.app.context, {
			resourceId: "teleporter:space/613940881048732244?label=true",
			actor: {
				name: 'Teleporter to Campfire',
				parentId: root.id,
				transform: {
					local: {
						position: { x: 1.2, y: 0.0, z: -0.5 }
					}
				}
			}
		}));
		libraryActors.push(MRE.Actor.CreateFromLibrary(this.app.context, {
			resourceId: "teleporter:event/1141596974185710470?label=true",
			actor: {
				name: 'Teleporter to Altstock',
				parentId: root.id,
				transform: {
					local: {
						position: { x: -1.2, y: 0.0, z: -0.5 }
					}
				}
			}
		}));

		// Show the item name when hovering on each item
		libraryActors.forEach((actor: MRE.ForwardPromise<MRE.Actor>) => {
			if (actor) {
				const buttonBehavior = actor.value.setBehavior(MRE.ButtonBehavior);
				// Trigger the grow/shrink animations on hover.
				buttonBehavior.onHover('enter', () => {
					this.app.setOverrideText(actor.value.name);
				});
				buttonBehavior.onHover('exit', () => {
					this.app.setOverrideText(null);
				});
			}
		});

		await this.stoppedAsync();
		return true;
	}
}
