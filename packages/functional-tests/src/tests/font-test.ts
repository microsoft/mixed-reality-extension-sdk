/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Test } from '../test';

const options = {
	font: Object.keys(MRE.TextFontFamily) as MRE.TextFontFamily[],
};

/** Defines an animation control field */
interface ControlDefinition {
	/** Decorative label for the control */
	label: string;
	/** Changes a property, and returns a result string */
	action: (incr: number) => string;
	/** Whether the control should be updated on a timer */
	realtime?: boolean;
	/** The actor who's text needs to be updated */
	labelActor?: MRE.Actor;
}

// };
/**
 * Test the text api functionality
 */
export default class TextTest extends Test {
	public expectedResultDescription = "Unicode Block and Font Test";
	public interval: NodeJS.Timeout;
	private assets: MRE.AssetContainer;

	private textActors: MRE.Actor[] = [];

	private textBlocks: any[] = [];
	private currentList = 0;

	private cycleOptions(): void {
		for(const text of this.textActors) {
			text.text.contents = this.textBlocks[this.currentList].displayString;
		}
	}
	
	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	public createDisplayString(x: any) {
		const unicodeChars: number[] = [];
		for(let i = x.blockStart; i < x.blockEnd; ++i){
			unicodeChars.push(i);

			//Insert newline every 60 characters
			if((i - x.blockStart) % 60 === 0) {
				unicodeChars.push('\n'.charCodeAt(0));
			}
		}
		x.displayString = String.fromCharCode(...unicodeChars);
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.textBlocks.push(
			{blockStart: 0x20, blockEnd:0x07E, name:"Latin Basic"},
			{blockStart: 0xA0, blockEnd: 0xFF, name:"Latin Suppliment"},
			{blockStart: 0x100, blockEnd:0x017F, name:"Latin Extended - A"},
			{blockStart: 0x3060, blockEnd:0x309F, name:"Japanese Hiragana/Katakana"},
			{blockStart: 0x4E00, blockEnd:0x4E7F, name:"Chinese/Japanese/Korean Ideographs"});		

		this.textBlocks.forEach((v,i,a) =>{ this.createDisplayString(v); });


		const position = new MRE.Vector3(0,2.5,-.3);
		for(const font of options.font) {
			const newActor = this.createTemplate(root, this.textBlocks[0].displayString);
			newActor.transform.local.position.copy(position);
			newActor.text.font = font;
			this.textActors.push( newActor );
			position.addInPlace(MRE.Vector3.Down().scale(.5))
		}

		const controls: ControlDefinition[] = [
			{
				label: "Unicode Block", action: incr => {
					if (incr > 0 ) {
						this.currentList++;
						if(this.currentList >= this.textBlocks.length) {
							this.currentList = 0;
						}
						this.cycleOptions();
					} else if (incr < 0) {
						this.currentList--;
						if(this.currentList < 0) {
							this.currentList = this.textBlocks.length - 1;
						}
						this.cycleOptions();
					}
					return this.textBlocks[this.currentList].name.toString();
				}
			}
		]

		this.createControls(controls, MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'controlsParent',
				parentId: root.id,
				transform: { local: { position: { x: -1, y: .2, z: -1 } } }
			}
		}));

		await this.stoppedAsync();
		return true;
	}

	private createTemplate(root: MRE.Actor, text: string): MRE.Actor {
		return MRE.Actor.Create(this.app.context, {
			actor: {
				name: text.replace('\n', ' '),
				parentId: root.id,
				text: {
					contents: text,
					height: 0.15,
					anchor: MRE.TextAnchorLocation.MiddleCenter
					
				},
			}
		});
	}

	private createControls(controls: ControlDefinition[], parent: MRE.Actor) {
		const arrowMesh = this.assets.createCylinderMesh('arrow', 0.01, 0.08, 'z', 3);
		const layout = new MRE.PlanarGridLayout(parent);

		let i = 0;
		const realtimeLabels = [] as ControlDefinition[];
		for (const controlDef of controls) {
			let label: MRE.Actor, more: MRE.Actor, less: MRE.Actor;
			layout.addCell({
				row: i,
				column: 1,
				width: 0.3,
				height: 0.25,
				contents: label = MRE.Actor.Create(this.app.context, {
					actor: {
						name: `${controlDef.label}-label`,
						parentId: parent.id,
						text: {
							contents: `${controlDef.label}:\n${controlDef.action(0)}`,
							height: 0.1,
							anchor: MRE.TextAnchorLocation.MiddleCenter,
							justify: MRE.TextJustify.Center,
							color: MRE.Color3.FromInts(255, 200, 255)
						}
					}
				})
			});
			controlDef.labelActor = label;

			layout.addCell({
				row: i,
				column: 0,
				width: 0.3,
				height: 0.25,
				contents: less = MRE.Actor.Create(this.app.context, {
					actor: {
						name: `${controlDef.label}-less`,
						parentId: parent.id,
						appearance: { meshId: arrowMesh.id },
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: { local: { rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI * 1.5) } }
					}
				})
			});

			layout.addCell({
				row: i,
				column: 2,
				width: 0.3,
				height: 0.25,
				contents: more = MRE.Actor.Create(this.app.context, {
					actor: {
						name: `${controlDef.label}-more`,
						parentId: parent.id,
						appearance: { meshId: arrowMesh.id },
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: { local: { rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI * 0.5) } }
					}
				})
			});

			if (controlDef.realtime) { realtimeLabels.push(controlDef) }

			less.setBehavior(MRE.ButtonBehavior).onClick(() => {
				label.text.contents = `${controlDef.label}:\n${controlDef.action(-1)}`;
				for (const rt of realtimeLabels) {
					rt.labelActor.text.contents = `${rt.label}:\n${rt.action(0)}`;
				}
			});
			more.setBehavior(MRE.ButtonBehavior).onClick(() => {
				label.text.contents = `${controlDef.label}:\n${controlDef.action(1)}`;
				for (const rt of realtimeLabels) {
					rt.labelActor.text.contents = `${rt.label}:\n${rt.action(0)}`;
				}
			});

			i++;
		}
		layout.applyLayout();

		setInterval(() => {
			for (const rt of realtimeLabels) {
				rt.labelActor.text.contents = `${rt.label}:\n${rt.action(0)}`;
			}
		}, 250);
	}
}
