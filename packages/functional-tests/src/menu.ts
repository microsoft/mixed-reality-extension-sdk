/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { App, FailureColor, NeutralColor, SuccessColor } from './app';
import { TestFactory } from './test';
import { Factories } from './tests';
import destroyActors from './utils/destroyActors';
import { paginate } from './utils/paginate';

type SelectionHandler = (name: string, factory: TestFactory, user: MRE.User) => void;

export interface MenuItem {
	label: string;
	action: TestFactory | MenuItem[];
}

const pageSize = 6;
const buttonSpacing = 2 / (pageSize + 1);
const buttonWidth = 0.25;
const buttonHeight = buttonSpacing * 0.8;

const MenuItems = paginate(Factories, pageSize);

export class Menu {
	private buttons: MRE.Actor[];
	private behaviors: MRE.ButtonBehavior[];
	private labels: MRE.Actor[];

	private successMat: MRE.Material;
	private failureMat: MRE.Material;
	private neutralMat: MRE.Material;
	private buttonMesh: MRE.Mesh;

	private breadcrumbs: number[] = [];
	private otherActors: MRE.Actor[];
	private handler: SelectionHandler;

	private get context() { return this.app.context; }

	constructor(private app: App) {

	}

	public onSelection(handler: SelectionHandler) {
		this.handler = handler;
	}

	public hide() {
		this.destroy();
	}

	public back() {
		this.breadcrumbs.pop();
	}

	public show(root = false) {
		if (!this.buttons) {
			this.setup();
		}

		const menu = root || !this.breadcrumbs.length ?
			MenuItems :
			this.breadcrumbs.reduce((submenu, choice) => submenu[choice].action as MenuItem[], MenuItems);

		this.behaviors.forEach((behavior, i) => {
			let handler: MRE.ActionHandler;
			let label: string;
			let buttonMat: MRE.Material;

			if (!menu[i]) {
				label = "";
				handler = null;
				buttonMat = null;
			} else if (typeof menu[i].action === 'function') {
				label = menu[i].label;
				handler = user => {
					if (this.handler) {
						this.handler(menu[i].label, menu[i].action as TestFactory, user);
					}
				};
				buttonMat = this.app.testResults[label] === true ? this.successMat :
					this.app.testResults[label] === false ? this.failureMat : this.neutralMat;

			} else {
				label = menu[i].label;
				handler = () => {
					this.breadcrumbs.push(i);
					this.show();
				};
				const allTestsPass = (menu[i].action as MenuItem[])
					.reduce((sum, test, j, arr) => {
						if (Array.isArray(test.action)) {
							arr.push(...test.action);
						} else {
							return sum || !!this.app.testResults[test.label];
						}
					}, false);
				buttonMat = allTestsPass ? this.successMat : null;
			}

			this.buttons[i].appearance.material = buttonMat;
			this.labels[i].text.contents = label;
			behavior.onButton('released', handler);
		});
	}

	private setup() {
		if (!this.successMat) {
			const am = this.app.assets;
			this.successMat = am.createMaterial('success', { color: SuccessColor });
			this.failureMat = am.createMaterial('failure', { color: FailureColor });
			this.neutralMat = am.createMaterial('neutral', { color: NeutralColor });
			this.buttonMesh = am.createBoxMesh('button', buttonWidth, buttonHeight, 0.1);
		}

		if (this.buttons) {
			this.destroy();
		}

		this.buttons = [];
		this.behaviors = [];
		this.labels = [];

		for (let i = 0; i < pageSize; i++) {
			const control = MRE.Actor.Create(this.context, {
				actor: {
					name: 'Button' + i,
					appearance: {
						meshId: this.buttonMesh.id,
						materialId: this.neutralMat.id
					},
					transform: {
						local: {
							position: {
								x: -1 + buttonWidth / 2,
								y: buttonSpacing / 2 + buttonSpacing * (pageSize - i),
								z: -0.05
							}
						}
					},
					collider: { geometry: { shape: MRE.ColliderType.Auto } }
				}
			});
			this.behaviors.push(control.setBehavior(MRE.ButtonBehavior));
			this.buttons.push(control);

			const label = MRE.Actor.Create(this.context, {
				actor: {
					name: 'Label' + i,
					parentId: control.id,
					transform: {
						local: {
							position: { x: buttonWidth * 1.2, z: 0.05 }
						},
					},
					text: {
						contents: "Placeholder",
						height: 0.2,
						anchor: MRE.TextAnchorLocation.MiddleLeft
					}
				}
			});
			this.labels.push(label);
		}

		const backButton = MRE.Actor.Create(this.context, {
			actor: {
				name: 'BackButton',
				appearance: {
					meshId: this.buttonMesh.id
				},
				transform: {
					local: {
						position: { x: -1 + buttonWidth / 2, y: buttonSpacing / 2, z: -0.05 }
					}
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } }
			}
		});

		const backLabel = MRE.Actor.Create(this.context, {
			actor: {
				name: 'BackLabel',
				parentId: backButton.id,
				transform: {
					local: {
						position: { x: buttonWidth * 1.2, z: 0.05 }
					},
				},
				text: {
					contents: "Back",
					height: 0.2,
					anchor: MRE.TextAnchorLocation.MiddleLeft
				}
			}
		});

		backButton.setBehavior(MRE.ButtonBehavior)
			.onButton('released', () => {
				this.back();
				this.show();
			});

		this.otherActors = [backButton, backLabel];
	}

	private destroy() {
		destroyActors(this.buttons);
		destroyActors(this.otherActors);
		this.buttons = null;
		this.behaviors = null;
		this.labels = null;
		this.otherActors = null;
	}
}
