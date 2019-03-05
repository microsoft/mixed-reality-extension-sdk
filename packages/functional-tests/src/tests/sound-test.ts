/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import delay from '../utils/delay';

export default class SoundTest extends Test {
    public expectedResultDescription = "Sounds. Click buttons to toggle";

    private _musicState = 0;
    private _dopplerSoundState = 0;

    // Chords for the first few seconds of The Entertainer
    private chords: number[][] =
        [
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

    public async run(): Promise<boolean> {

        const musicButtonPromise = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: 0.3,
                uSegments: 8,
                vSegments: 4

            },
            addCollider: true,
            actor: {
                name: 'MusicButton',
                transform: {
                    position: { x: -1, y: 1.3, z: 1 }
                }
            }
        });

        const musicAssetPromise = this.app.context.assetManager.createSound(
            'group1',
            { uri: `https://api.modarchive.org/downloads.php?moduleid=42560#GSLINGER.MOD` }
        );
        const musicSoundInstance = musicButtonPromise.value.startSound(musicAssetPromise.value.id,
            {
                volume: 0.2,
                looping: true,
                doppler: 0.0,
                multiChannelSpread: 0.7,
                rolloffStartDistance: 2.5
            },
            0.0);
        const musicButtonBehavior = musicButtonPromise.value.setBehavior(MRE.ButtonBehavior);
        const cycleMusicState = () => {
            if (this._musicState === 0) {
                musicSoundInstance.value.pause();
            } else if (this._musicState === 1) {
                musicSoundInstance.value.resume();
            }
            this._musicState = (this._musicState + 1) % 2;
        };
        musicButtonBehavior.onClick('released', cycleMusicState);

        const notesButtonPromise = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: 0.3,
                uSegments: 8,
                vSegments: 4

            },
            addCollider: true,
            actor: {
                name: 'NotesButton',
                transform: {
                    position: { x: 0, y: 1.3, z: 1 }
                }
            }
        });

        const notesAssetPromise = this.app.context.assetManager.createSound(
            'group1',
            { uri: `${this.baseUrl}/note.wav` }
        );

        const notesButtonBehavior = notesButtonPromise.value.setBehavior(MRE.ButtonBehavior);
        const playNotes = async () => {
            for (const chord of this.chords) {
                for (const note of chord) {
                    notesButtonPromise.value.startSound(notesAssetPromise.value.id,
                        {
                            doppler: 0.0,
                            pitch: note,
                        });
                }
                await delay(200);
            }
        };
        notesButtonBehavior.onClick('released', playNotes);

        const dopplerButtonPromise = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: 0.3,
                uSegments: 8,
                vSegments: 4

            },
            addCollider: true,
            actor: {
                name: 'DopplerButton',
                transform: {
                    position: { x: 1, y: 1.3, z: 1 }
                }
            }
        });
        const dopplerMoverPromise = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: 0.15,
                uSegments: 8,
                vSegments: 4

            },
            actor: {
                parentId: dopplerButtonPromise.value.id,
                name: 'DopplerMover',
                transform: {
                    position: { x: 0, y: 0, z: 3 }
                }
            }
        });
        dopplerButtonPromise.value.createAnimation(
            'flyaround', {
                keyframes: this.generateSpinKeyframes(2.0, MRE.Vector3.Up()),
                wrapMode: MRE.AnimationWrapMode.Loop

            }).catch(reason => console.log(`Failed to create flip animation: ${reason}`));

        const dopplerAssetPromise = this.app.context.assetManager.createSound(
            'group1',
            { uri: `${this.baseUrl}/UI-ButtonSelectSmall.wav` }
        );
        const dopplerSoundInstance = dopplerMoverPromise.value.startSound(dopplerAssetPromise.value.id,
            {
                volume: 0.5,
                looping: true,
                doppler: 5.0,
                multiChannelSpread: 0.0,
                rolloffStartDistance: 9.3,
            },
            0.0);
        dopplerSoundInstance.value.pause();
        const dopplerButtonBehavior = dopplerButtonPromise.value.setBehavior(MRE.ButtonBehavior);
        const cycleDopplerSoundState = () => {
            if (this._dopplerSoundState === 0) {
                dopplerSoundInstance.value.resume();
                dopplerButtonPromise.value.enableAnimation('flyaround');

            } else if (this._dopplerSoundState === 1) {
                dopplerButtonPromise.value.disableAnimation('flyaround');
                dopplerSoundInstance.value.pause();
            }
            this._dopplerSoundState = (this._dopplerSoundState + 1) % 2;
        };
        dopplerButtonBehavior.onClick('released', cycleDopplerSoundState);

        await this.stoppedAsync();
        return true;
    }

    private generateSpinKeyframes(duration: number, axis: MRE.Vector3, start = 0): MRE.AnimationKeyframe[] {
        return [{
            time: 0 * duration,
            value: { transform: { rotation: MRE.Quaternion.RotationAxis(axis, start) } }
        }, {
            time: 0.25 * duration,
            value: { transform: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI * 1 / 2) } }
        }, {
            time: 0.5 * duration,
            value: { transform: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI * 2 / 2) } }
        }, {
            time: 0.75 * duration,
            value: { transform: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI * 3 / 2) } }
        }, {
            time: 1 * duration,
            value: { transform: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI * 4 / 2) } }
        }];
    }
}
