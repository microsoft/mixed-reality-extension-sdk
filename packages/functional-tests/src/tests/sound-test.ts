/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import delay from '../utils/delay';

export default class SoundTest extends Test {
	public expectedResultDescription = "Sounds. Click buttons to toggle";
	private assets: MRE.AssetContainer;

	private _musicState = 0;
	private _dopplerSoundState = 0;

	// Chords for the first few seconds of The Entertainer
	private chords: number[][] = [
		[2 + 12],
		[4 + 12],
		[0 + 12],
		[-3 + 12],
		[],
		[-1 + 12],
		[-5 + 12],
		[],
		[2],
		[4],
		[0],
		[-3],
		[],
		[-1],
		[-5],
		[],
		[2 - 12],
		[4 - 12],
		[0 - 12],
		[-3 - 12],
		[],
		[-1 - 12],
		[-3 - 12],
		[-4 - 12],
		[-5 - 12],
		[],
		[],
		[],
		[-1, 7]
	];

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const buttonMesh = this.assets.createSphereMesh('sphere', 0.2, 8, 4);

		const musicButton = MRE.Actor.CreateEmpty(this.app.context, {
			actor: {
				name: 'MusicButton',
				parentId: root.id,
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: -0.8, y: 1.3, z: -0.2 }
					}
				}
			}
		});

		const musicAsset = this.assets.createSound(
			'music',
			{ uri: `${this.baseUrl}/FTUI_Music.ogg` }
		);
		const musicSoundInstance = musicButton.startSound(musicAsset.id,
			{
				volume: 0.2,
				looping: true,
				doppler: 0.0,
				spread: 0.7,
				rolloffStartDistance: 2.5,
				time: 30.0
			});
		musicSoundInstance.pause();
		const musicButtonBehavior = musicButton.setBehavior(MRE.ButtonBehavior);
		const cycleMusicState = () => {
			if (this._musicState === 0) {
				musicSoundInstance.resume();
			} else if (this._musicState === 1) {
				musicSoundInstance.pause();
			}
			this._musicState = (this._musicState + 1) % 2;
		};
		musicButtonBehavior.onButton('released', cycleMusicState);

		const notesButton = MRE.Actor.CreateEmpty(this.app.context, {
			actor: {
				name: 'NotesButton',
				parentId: root.id,
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 0, y: 1.3, z: -0.2 }
					}
				}
			}
		});

		const notesAsset = this.assets.createSound(
			'piano',
			{ uri: `${this.baseUrl}/Piano_C4.wav` }
		);

		const notesButtonBehavior = notesButton.setBehavior(MRE.ButtonBehavior);
		const playNotes = async () => {
			for (const chord of this.chords) {
				for (const note of chord) {
					notesButton.startSound(notesAsset.id, {
						doppler: 0.0,
						pitch: note,
					});
				}
				await delay(200);
			}
		};
		notesButtonBehavior.onButton('released', playNotes);

		const dopplerButton = MRE.Actor.CreateEmpty(this.app.context, {
			actor: {
				name: 'DopplerButton',
				parentId: root.id,
				appearance: { meshId: buttonMesh.id },
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 0.8, y: 1.3, z: -0.2 }
					}
				}
			}
		});
		const dopplerMover = MRE.Actor.CreateEmpty(this.app.context, {
			actor: {
				parentId: dopplerButton.id,
				name: 'DopplerMover',
				appearance: { meshId: this.assets.createSphereMesh('doppler', 0.15, 8, 4).id },
				collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry },
				transform: {
					local: {
						position: { x: 0, y: 0, z: 3 }
					}
				}
			}
		});
		dopplerButton.createAnimation(
			'flyaround', {
				keyframes: this.generateSpinKeyframes(2.0, MRE.Vector3.Up()),
				wrapMode: MRE.AnimationWrapMode.Loop
			});

		const dopplerAsset = this.assets.createSound(
			'truck',
			{ uri: `${this.baseUrl}/Car_Engine_Loop.wav` }
		);
		const dopplerSoundInstance = dopplerMover.startSound(dopplerAsset.id,
			{
				volume: 0.5,
				looping: true,
				doppler: 5.0,
				spread: 0.3,
				rolloffStartDistance: 9.3
			});
		dopplerSoundInstance.pause();
		const dopplerButtonBehavior = dopplerButton.setBehavior(MRE.ButtonBehavior);
		const cycleDopplerSoundState = () => {
			if (this._dopplerSoundState === 0) {
				dopplerSoundInstance.resume();
				dopplerButton.enableAnimation('flyaround');

			} else if (this._dopplerSoundState === 1) {
				dopplerButton.disableAnimation('flyaround');
				dopplerSoundInstance.pause();
			}
			this._dopplerSoundState = (this._dopplerSoundState + 1) % 2;
		};
		dopplerButtonBehavior.onButton('released', cycleDopplerSoundState);

		await this.stoppedAsync();

		return true;
	}

	private generateSpinKeyframes(duration: number, axis: MRE.Vector3, start = 0): MRE.AnimationKeyframe[] {
		return [{
			time: 0 * duration,
			value: { transform: { local: { rotation: MRE.Quaternion.RotationAxis(axis, start) } } }
		}, {
			time: 0.25 * duration,
			value: { transform: { local: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI * 1 / 2) } } }
		}, {
			time: 0.5 * duration,
			value: { transform: { local: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI * 2 / 2) } } }
		}, {
			time: 0.75 * duration,
			value: { transform: { local: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI * 3 / 2) } } }
		}, {
			time: 1 * duration,
			value: { transform: { local: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI * 4 / 2) } } }
		}];
	}
}
