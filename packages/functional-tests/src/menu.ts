/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { App, BackgroundColor, FailureColor, NeutralColor, SuccessColor } from './app';
import { TestFactory } from './test';
import { Factories, FactoryMap } from './tests';
import destroyActors from './utils/destroyActors';

type SelectionHandler = (name: string, factory: TestFactory, userId: string) => void;

interface MenuItem {
    label: string;
    action: TestFactory | MenuItem[];
}

const pageSize = 6;
const MenuItems = paginate(Factories);

export default class Menu {
    private buttons: MRE.Actor[];
    private behaviors: MRE.ButtonBehavior[];
    private labels: MRE.Actor[];

    private successMat: MRE.Material;
    private failureMat: MRE.Material;
    private neutralMat: MRE.Material;
    private backgroundMat: MRE.Material;

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
                handler = userId => {
                    if (this.handler) {
                        this.handler(menu[i].label, menu[i].action as TestFactory, userId);
                    }
                };
                buttonMat = this.app.testResults[label] === true ? this.successMat :
                    this.app.testResults[label] === false ? this.failureMat : this.neutralMat;

            } else {
                label = menu[i].label;
                handler = _ => {
                    this.breadcrumbs.push(i);
                    this.show();
                };
                buttonMat = null;
            }

            this.buttons[i].material = buttonMat;
            this.labels[i].text.contents = label;
            behavior.onClick('released', handler);
        });
    }

    private setup() {
        if (!this.successMat) {
            const am = this.context.assetManager;
            this.successMat = am.createMaterial('success', { color: SuccessColor }).value;
            this.failureMat = am.createMaterial('failure', { color: FailureColor }).value;
            this.neutralMat = am.createMaterial('neutral', { color: NeutralColor }).value;
            this.backgroundMat = am.createMaterial('background', { color: BackgroundColor }).value;
        }

        if (this.buttons) {
            this.destroy();
        }

        this.buttons = [];
        this.behaviors = [];
        this.labels = [];

        const buttonSpacing = 2 / (pageSize + 1);
        const buttonWidth = 0.25;
        const buttonHeight = buttonSpacing * 0.8;

        for (let i = 0; i < pageSize; i++) {
            const control = MRE.Actor.CreatePrimitive(this.context, {
                definition: {
                    shape: MRE.PrimitiveShape.Box,
                    dimensions: { x: buttonWidth, y: buttonHeight, z: 0.1 }
                },
                addCollider: true,
                actor: {
                    name: 'Button' + i,
                    transform: {
                        position:
                        { x: -1 + buttonWidth / 2, y: buttonSpacing / 2 + buttonSpacing * (pageSize - i), z: -0.05 }
                    }
                }
            }).value;
            this.behaviors.push(control.setBehavior(MRE.ButtonBehavior));
            this.buttons.push(control);

            const label = MRE.Actor.CreateEmpty(this.context, {
                actor: {
                    name: 'Label' + i,
                    parentId: control.id,
                    transform: {
                        position: { x: buttonWidth * 1.2, z: 0.05 },
                    },
                    text: {
                        contents: "Placeholder",
                        height: 0.2,
                        anchor: MRE.TextAnchorLocation.MiddleLeft
                    }
                }
            }).value;
            this.labels.push(label);
        }

        const backButton = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: buttonWidth, y: buttonHeight, z: 0.1 }
            },
            addCollider: true,
            actor: {
                name: 'BackButton',
                transform: {
                    position: { x: -1 + buttonWidth / 2, y: buttonSpacing / 2, z: -0.05 }
                }
            }
        }).value;

        const backLabel = MRE.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'BackLabel',
                parentId: backButton.id,
                transform: {
                    position: { x: buttonWidth * 1.2, z: 0.05 },
                },
                text: {
                    contents: "Back",
                    height: 0.2,
                    anchor: MRE.TextAnchorLocation.MiddleLeft
                }
            }
        }).value;

        backButton.setBehavior(MRE.ButtonBehavior)
            .onClick('released', () => {
                this.back();
                this.show();
            });

        const floor = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 2, y: 0.1, z: 2.1 }
            },
            addCollider: true,
            actor: {
                name: 'floor',
                transform: {
                    position: { x: 0, y: -0.05, z: -1 }
                },
            }
        }).value;
        floor.material = this.backgroundMat;

        const wall = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 2, y: 2, z: 0.1 }
            },
            addCollider: true,
            actor: {
                name: 'floor',
                transform: {
                    position: { x: 0, y: 1, z: 0.1 }
                }
            }
        }).value;
        wall.material = this.backgroundMat;
        this.otherActors = [backButton, backLabel, floor, wall];
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

function paginate(tests: FactoryMap): MenuItem[] {
    const names = Object.keys(tests).sort();
    const count = names.length;
    if (count <= pageSize) {
        return names.map(name => ({ label: name, action: tests[name] } as MenuItem));
    } else {
        const submenus: MenuItem[] = [];
        let lastName = '';

        while (names.length > 0) {
            const pageNames = names.splice(0, Math.max(pageSize, Math.floor(count / (pageSize - 1))));
            const lastPageName = pageNames[pageNames.length - 1];
            submenus.push({
                label: uniquePrefix(pageNames[0], lastName) + " - " + uniquePrefix(lastPageName, names[0] || ''),
                action: paginate(pageNames.reduce(
                    (sum, val) => { sum[val] = tests[val]; return sum; },
                    {} as FactoryMap
                ))
            });

            lastName = lastPageName;
        }

        return submenus;
    }
}

function uniquePrefix(of: string, against: string) {
    let prefixEnd = 0;

    while (of.charAt(prefixEnd) === against.charAt(prefixEnd)) {
        prefixEnd++;
    }

    return of.slice(0, prefixEnd + 1);
}
