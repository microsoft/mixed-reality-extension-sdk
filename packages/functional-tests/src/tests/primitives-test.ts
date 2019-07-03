/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import destroyActors from '../utils/destroyActors';

export default class PrimitivesTest extends Test {

	public async run(root: MRE.Actor): Promise<boolean> {
		// Make a root object.
		const tester = MRE.Actor.CreateEmpty(this.app.context, {
			actor: {
				parentId: root.id,
				transform: { local: { position: { y: 0.5, z: -0.5 }, scale: { x: 0.5, y: 0.5, z: 0.5 } } }
			}
		});
		MRE.Actor.CreateEmpty(this.app.context, {
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
		const primitiveActors: Array<MRE.ForwardPromise<MRE.Actor>> = [];

		for (let x = 0.1; x < 0.35; x += 0.1) {
			for (let y = 0.1; y < 0.35; y += 0.1) {
				for (let z = 0.1; z < 0.35; z += 0.1) {
					primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
						definition: {
							shape: MRE.PrimitiveShape.Box,
							dimensions: { x, y, z }
						},
						addCollider: true,
						actor: {
							name: 'Box',
							parentId: tester.value.id,
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
		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Sphere,
				radius: 0.4,
				uSegments: 8,
				vSegments: 4
			},
			addCollider: true,
			actor: {
				name: 'Sphere',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: -1, y: 1, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Capsule,
				dimensions: { x: 0, y: 0.7, z: 0 },
				radius: 0.3,
				uSegments: 8,
				vSegments: 4
			},
			addCollider: true,
			actor: {
				name: 'Capsule',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: 1, y: 1, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Capsule,
				dimensions: { x: 0.35, y: 0.0, z: 0 },
				radius: 0.15,
				uSegments: 8,
				vSegments: 4
			},
			addCollider: true,
			actor: {
				name: 'Capsule',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: 1, y: 2.0, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Capsule,
				dimensions: { x: 0, y: 0.0, z: 0.7 },
				radius: 0.3,
				uSegments: 8,
				vSegments: 4
			},
			addCollider: true,
			actor: {
				name: 'Capsule',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: 1 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Cylinder,
				dimensions: { x: 0, y: 1.3, z: 0 },
				radius: 0.3,
				uSegments: 8,
			},
			addCollider: true,
			actor: {
				name: 'Cylinder',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: 2, y: 1, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Cylinder,
				dimensions: { x: 0.65, y: 0, z: 0 },
				radius: 0.15,
				uSegments: 8,
			},
			addCollider: true,
			actor: {
				name: 'Cylinder',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: 2, y: 2.0, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Cylinder,
				dimensions: { x: 0, y: 0, z: 1.3 },
				radius: 0.3,
				uSegments: 8,
			},
			addCollider: true,
			actor: {
				name: 'Cylinder',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: 2 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Plane,
				dimensions: { x: 1, y: 0, z: 1 },
				uSegments: 1,
				vSegments: 4,

			},
			addCollider: true,
			actor: {
				name: 'Plane',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: -2, y: 0.0, z: 0 }
					}
				}
			}
		}));

		primitiveActors.push(MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.InnerSphere,
				radius: 0.4,
				uSegments: 12,
				vSegments: 8
			},
			addCollider: true,
			actor: {
				name: 'Inner Sphere',
				parentId: tester.value.id,
				transform: {
					local: {
						position: { x: -1 }
					}
				}
			}
		}));

		primitiveActors.forEach((actor: MRE.ForwardPromise<MRE.Actor>) => {
			if (actor) {
				const buttonBehavior = actor.value.setBehavior(MRE.ButtonBehavior);
				// Trigger the grow/shrink animations on hover.
				buttonBehavior.onHover('enter', _ => {
					this.app.setOverrideText(actor.value.name);
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
