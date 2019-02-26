/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { TestFactory } from './test';
import { Factories, FactoryMap } from './tests';
import destroyActors from './utils/destroyActors';

type SelectionHandler = (name: string, factory: TestFactory, userId: string) => void;

interface MenuItem {
    label: string;
    action: TestFactory | MenuItem[];
}

const MenuItems = paginate(Factories, 5);

export default class Menu {
    private buttons: MRE.Actor[];
    private behaviors: MRE.ButtonBehavior[];
    private labels: MRE.Actor[];

    private breadcrumbs: number[] = [];
    private backActors: MRE.Actor[];
    private handler: SelectionHandler;

    constructor(private context: MRE.Context) {

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

            if (!menu[i]) {
                label = "";
                handler = null;
            } else if (typeof menu[i].action === 'function') {
                label = menu[i].label;
                handler = userId => {
                    console.log('running test', menu[i].label);
                    if (this.handler) {
                        this.handler(menu[i].label, menu[i].action as TestFactory, userId);
                    }
                };
            } else {
                label = menu[i].label;
                handler = _ => {
                    console.log('generating submenu', i);
                    this.breadcrumbs.push(i);
                    this.show();
                };
            }

            this.labels[i].text.contents = label;
            behavior.onClick('released', handler);
        });
    }

    private setup() {
        if (this.buttons) {
            this.destroy();
        }

        this.buttons = [];
        this.behaviors = [];
        this.labels = [];

        for (let i = 0; i < MenuItems.length; i++) {
            const control = MRE.Actor.CreatePrimitive(this.context, {
                definition: {
                    shape: MRE.PrimitiveShape.Box,
                    dimensions: { x: 0.3, y: 0.3, z: 0.05 }
                },
                addCollider: true,
                actor: {
                    name: 'Button' + i,
                    transform: {
                        position: { x: 1, y: 1 - 0.4 * i }
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
                        position: { x: -0.25 },
                        rotation: { x: 0, y: 1, z: 0, w: 0 }
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
                dimensions: { x: 0.3, y: 0.3, z: 0.05 }
            },
            addCollider: true,
            actor: {
                name: 'BackButton',
                transform: {
                    position: { x: 1, y: -1 }
                }
            }
        }).value;

        const backLabel = MRE.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'BackLabel',
                parentId: backButton.id,
                transform: {
                    position: { x: -0.25 },
                    rotation: { x: 0, y: 1, z: 0, w: 0 }
                },
                text: {
                    contents: "Back",
                    height: 0.2,
                    anchor: MRE.TextAnchorLocation.MiddleLeft
                }
            }
        }).value;

        backButton.setBehavior(MRE.ButtonBehavior)
            .onClick('pressed', () => {
                this.back();
                this.show();
            });

        this.backActors = [backButton, backLabel];
    }

    private destroy() {
        destroyActors(this.buttons);
        destroyActors(this.backActors);
        this.buttons = null;
        this.behaviors = null;
        this.labels = null;
        this.backActors = null;
    }
}

function paginate(tests: FactoryMap, itemsPerPage: number): MenuItem[] {
    const names = Object.keys(tests).sort();
    const count = names.length;
    if (count <= itemsPerPage) {
        return names.map(name => ({ label: name, action: tests[name] } as MenuItem));
    } else {
        const submenus: MenuItem[] = [];
        let lastName = '';

        while (names.length > 0) {
            const pageNames = names.splice(0, Math.ceil(count / itemsPerPage));
            const lastPageName = pageNames[pageNames.length - 1];
            submenus.push({
                label: uniquePrefix(pageNames[0], lastName) + " => " + uniquePrefix(lastPageName, names[0] || ''),
                action: paginate(pageNames.reduce(
                    (sum, val) => { sum[val] = tests[val]; return sum; },
                    {} as FactoryMap
                ), itemsPerPage)
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
