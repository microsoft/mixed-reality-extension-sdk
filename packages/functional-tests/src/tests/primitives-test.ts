/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class PrimitivesTest extends Test {
	public expectedResultDescription = "A variety of primitives";
	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		// Make a root object.
		const tester = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				transform: { local: { position: { y: 0.5, z: -0.5 }, scale: { x: 0.5, y: 0.5, z: 0.5 } } }
			}
		});
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
		const primitiveActors: MRE.Actor[] = [];

		let i = 0;
		for (let x = 0.1; x < 0.35; x += 0.1) {
			for (let y = 0.1; y < 0.35; y += 0.1) {
				for (let z = 0.1; z < 0.35; z += 0.1) {
					primitiveActors.push(MRE.Actor.Create(this.app.context, {
						actor: {
							name: 'Box',
							parentId: tester.id,
							appearance: {
								meshId: this.assets.createBoxMesh(`box${i++}`, x, y, z).id
							},
							collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
							transform: {
								local: {
									position: { x: x * 4 - 0.8, y: y * 4 + 0., z: z * 4 - 0.5 }
								}
							}
						}
					}));
				}
			}
		}
		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Sphere',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createSphereMesh('sphere', 0.4, 8, 4).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: -1, y: 1, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Capsule',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createCapsuleMesh('capsule1', 0.7, 0.3, 'y', 8, 4).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 1, y: 1, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Capsule',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createCapsuleMesh('capsule2', 0.35, 0.15, 'x', 8, 4).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 1, y: 2.0, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Capsule',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createCapsuleMesh('capsule3', 0.7, 0.3, 'z', 8, 4).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 1 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Cylinder',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createCylinderMesh('cylinder1', 1.3, 0.3, 'y', 8).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 2, y: 1, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Cylinder',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createCylinderMesh('cylinder2', 0.65, 0.15, 'x', 8).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 2, y: 2.0, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Cylinder',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createCylinderMesh('cylinder3', 1.3, 0.3, 'z', 8).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 2 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Plane',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createPlaneMesh('plane', 1, 1, 1, 4).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: -2, y: 0.0, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Inner Sphere',
				parentId: tester.id,
				appearance: {
					meshId: this.assets.createSphereMesh('innerSphere', -0.4, 12, 8).id
				},
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: -1 }
					}
				}
			}
		}));

		primitiveActors.forEach((actor) => {
			if (actor) {
				const buttonBehavior = actor.setBehavior(MRE.ButtonBehavior);
				// Trigger the grow/shrink animations on hover.
				buttonBehavior.onHover('enter', _ => {
					this.app.setOverrideText(actor.name);
				});
				buttonBehavior.onHover('exit', _ => {
					this.app.setOverrideText(null);
				});
			}
		});

		await this.stoppedAsync();
		return true;
	}
}
