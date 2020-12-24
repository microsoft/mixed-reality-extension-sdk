/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { App, FailureColor, NeutralColor, SuccessColor } from './app';
import { TestFactory } from './test';
import { Factories } from './tests';
import destroyActors from './utils/destroyActors';
import { populatePages, MenuNode } from './utils/paginate';
import { ButtonEventData } from '@microsoft/mixed-reality-extension-sdk';

type SelectionHandler = (name: string, factory: TestFactory, user: MRE.User) => void;

export interface MenuItem {
	label: string;
	action: TestFactory | MenuNode;
}

const pageSize = 6;
const buttonSpacing = 2 / (pageSize + 1);
const buttonWidth = 0.25;
const buttonHeight = buttonSpacing * 0.8;

const MenuItems = populatePages(Factories, pageSize);

export class Menu {
	private buttons: MRE.Actor[];
	private behaviors: MRE.ButtonBehavior[];
	private labels: MRE.Actor[];

	private currentNode: MenuNode = null;

	private successMat: MRE.Material;
	private failureMat: MRE.Material;
	private neutralMat: MRE.Material;
	private buttonMesh: MRE.Mesh;

	private backActors: MRE.Actor[];
	private nextPage: MRE.Actor;
	private prevPage: MRE.Actor;
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
		if (this.currentNode.parent !== null) {
			this.currentNode = this.currentNode.parent;
		}
	}

	public show() {
		if (!this.buttons) {
			this.setup();
		}

		const menu = this.currentNode.menuItems;

		this.behaviors.forEach((behavior, i) => {
			let handler: MRE.ActionHandler<ButtonEventData>;
			let label: string;
			let buttonMat: MRE.Material;

			const pageIndex = i + this.currentNode.currentPage * pageSize;


			if (!menu[pageIndex]) {
				label = "";
				handler = null;
				buttonMat = null;
			} else if (typeof menu[pageIndex].action === 'function') {
				label = menu[pageIndex].label;
				handler = user => {
					if (this.handler) {
						this.handler(menu[pageIndex].label, menu[pageIndex].action as TestFactory, user);
					}
				};
				buttonMat = this.app.testResults[label] === true ? this.successMat :
					this.app.testResults[label] === false ? this.failureMat : this.neutralMat;

			} else {
				label = menu[pageIndex].label;
				handler = () => {
					this.currentNode = menu[pageIndex].action as MenuNode;
					this.show();
				};
				const allTestsPass = (menu[pageIndex].action as MenuNode).menuItems
					.reduce((sum, test, j, arr) => {
						if ( typeof test.action !== 'function') {
							arr.push(...test.action.menuItems);
						} else {
							return sum && this.app.testResults[test.label] === true;
						}
					}, true);
				const anyTestFails = (menu[pageIndex].action as MenuNode).menuItems
					.reduce((sum, test, j, arr) => {
						if ( typeof test.action !== 'function') {
							arr.push(...test.action.menuItems);
						} else {
							return sum || this.app.testResults[test.label] === false;
						}
					}, false);
				buttonMat = allTestsPass ? this.successMat : (anyTestFails ? this.failureMat : null);
			}

			this.buttons[i].appearance.material = buttonMat;
			this.labels[i].text.contents = label;
			behavior.onButton('released', handler);
		});

		// hide back button on root menu
		if (this.currentNode.parent === null) {
			for (const a of this.backActors) {
				a.appearance.enabled = false;
				if (a.text) { a.text.enabled = false; }
			}
		} else {
			for (const a of this.backActors) {
				a.appearance.enabled = true;
				if (a.text) { a.text.enabled = true; }
			}
		}

		// hide next button if no more pages
		if((this.currentNode.currentPage + 1) * pageSize > this.currentNode.menuItems.length) {
			this.nextPage.appearance.enabled = false;
		} else {
			this.nextPage.appearance.enabled = true;
		}

		// hide back button if no more pages
		if(this.currentNode.currentPage === 0) {
			this.prevPage.appearance.enabled = false;
		} else {
			this.prevPage.appearance.enabled = true;
		}
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
							position: { x: buttonWidth * 0.8, z: 0.05 }
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

		this.nextPage = MRE.Actor.Create(this.context, {
			actor: {
				name: 'NextPage',
				appearance: {
					meshId: this.buttonMesh.id
				},
				transform: {
					local: {
						position: { x: 2 + buttonWidth / 2, y: (buttonSpacing), z: -0.05 }
					}
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } }
			}
		});

		this.prevPage = MRE.Actor.Create(this.context, {
			actor: {
				name: 'PrevPage',
				appearance: {
					meshId: this.buttonMesh.id
				},
				transform: {
					local: {
						position: { x: -2 + buttonWidth / 2, y: (buttonSpacing), z: -0.05 }
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
						position: { x: buttonWidth * 0.8, z: 0.05 }
					},
				},
				text: {
					contents: "Back",
					height: 0.2,
					anchor: MRE.TextAnchorLocation.MiddleLeft
				}
			}
		});

		MRE.Actor.Create(this.context, {
			actor: {
				name: 'PrevLabel',
				parentId: this.prevPage.id,
				transform: {
					local: {
						position: { y: buttonWidth * 0.8, z: 0.05 }
					},
				},
				text: {
					contents: "Prev Page",
					height: 0.2,
					anchor: MRE.TextAnchorLocation.BottomCenter
				}
			}
		});

		MRE.Actor.Create(this.context, {
			actor: {
				name: 'nextLabel',
				parentId: this.nextPage.id,
				transform: {
					local: {
						position: { y: buttonWidth * 0.8, z: 0.05 }
					},
				},
				text: {
					contents: "Next Page",
					height: 0.2,
					anchor: MRE.TextAnchorLocation.BottomCenter
				}
			}
		});

		backButton.setBehavior(MRE.ButtonBehavior)
			.onButton('released', () => {
				this.back();
				this.show();
			});

		this.backActors = [backButton, backLabel];
	
		this.nextPage.setBehavior(MRE.ButtonBehavior).onButton('released', () => {
			if(this.currentNode.menuItems.length > ((this.currentNode.currentPage + 1) * pageSize)) {
				++this.currentNode.currentPage;
				this.show();
			}
		});

		this.prevPage.setBehavior(MRE.ButtonBehavior).onButton('released', () => {
			if((this.currentNode.currentPage > 0)) {
				--this.currentNode.currentPage;
				this.show();
			}
		});

		if(this.currentNode === null) {
			this.currentNode = MenuItems;
		}
	}

	private destroy() {
		destroyActors(this.buttons);
		destroyActors(this.backActors);
		this.nextPage.destroy();
		this.prevPage.destroy();
		this.buttons = null;
		this.behaviors = null;
		this.labels = null;
		this.backActors = null;

	}
}
