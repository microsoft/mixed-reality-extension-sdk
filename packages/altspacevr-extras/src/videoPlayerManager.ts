/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Context,
    User,
} from '@microsoft/mixed-reality-extension-sdk';

import {
    ContextRPC,
    UserRPC
} from '@microsoft/mixed-reality-extension-sdk/built/rpc';
import { debug } from 'util';

type Video = { url: string; basisTime: number };
type VideoList = { [actorId: string]: Video };

/**
 * The main class of this app. All the logic goes here.
 */

export class VideoPlayerManager {
    private _RPC: ContextRPC;
    private hasAnyUserJoined = false;
    private videos: VideoList = {};
    private state: string;

    constructor(private context: Context) {
        if (context.users.length > 0) {
            this.hasAnyUserJoined = true;
        }

        this._RPC = new ContextRPC(context);

        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);
    }

    public cleanup() {
        this.context.offUserJoined(this.userJoined);
        this._RPC.cleanup();
    }

    // private userJoined(user: User) {
    //     if (Object.keys(this.videos).length > 0) {
    //         const userRPC = new UserRPC(user);
    //         for (const actorID in this.videos) {
    //             if (this.videos.hasOwnProperty(actorID)) {
    //                 userRPC.emit('VideoPlay',
    //                     {
    //                         parentId: actorID,
    //                         URL: this.videos[actorID].url,
    //                         startTime: this.videos[actorID].basisTime + Date.now() / 1000.0
    //                     });
    //             }
    //         }
    //     }
    //     this.hasAnyUserJoined = true;
    // }

    private userJoined(user: User) {
        this.hasAnyUserJoined = true;
        const userRPC = new UserRPC(user);
        for (const actorID in this.videos) {
            if (this.videos.hasOwnProperty(actorID)) {
                if (this.state === "show") {
                    userRPC.emit('VideoShow',
                        {
                            parentId: actorID,
                            URL: this.videos[actorID].url,
                            startTime: this.videos[actorID].basisTime + Date.now() / 1000.0,
                            showScreen: true
                        });
                }
                if (this.state === "play") {
                    userRPC.emit('VideoPlay',
                        {
                            parentId: actorID,
                            URL: this.videos[actorID].url,
                            startTime: this.videos[actorID].basisTime + Date.now() / 1000.0
                        });
                }
            }
        }
    }

    public play(actorID: string, url: string, startTime: number) {
        this.state = "play";
        if (this.hasAnyUserJoined) {
            this._RPC.emit('VideoPlay', { parentId: actorID, URL: url, startTime });
        }
    }

    public stop(actorID: string) {
        if (this.hasAnyUserJoined) {
            this._RPC.emit('VideoPlay', { parentId: actorID, URL: "", startTime: 0.0 });
        }
    }

    public show(actorID: string, url: string, startTime: number, isShowing: boolean) {
        this.state = "show";
        if (this.videos[actorID] === undefined || this.videos[actorID].url !== url) {
            this.videos[actorID] = { url, basisTime: startTime - Date.now() / 1000.0 };
            if (this.hasAnyUserJoined) {
                this._RPC.emit('VideoShow', { parentId: actorID, URL: url, startTime, showScreen: isShowing });
            }
        }
    }

    public hide(actorID: string, url: string, startTime: number, isShowing: boolean) {
            this._RPC.emit('VideoShow', { parentId: actorID, URL: url, startTime, showScreen: isShowing });
    }
}
