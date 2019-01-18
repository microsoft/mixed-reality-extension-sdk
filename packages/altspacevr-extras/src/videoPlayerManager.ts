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

type Video = { URL: string; basisTime: number };
type VideoList = { [actorId: string]: Video };

/**
 * The main class of this app. All the logic goes here.
 */

export class VideoPlayerManager {
    private _RPC: ContextRPC;
    private userCount = 0;
    private videos: VideoList = {};

    constructor(private context: Context, initialUserCount?: number) {
        if (initialUserCount !== undefined) {
            this.userCount = initialUserCount;
        }
        this._RPC = new ContextRPC(context);
        this.context.onUserJoined(user => this.userJoined(user));
        this.context.onUserLeft(user => this.userLeft(user));
    }

    private userJoined(user: User) {
        if (Object.keys(this.videos).length > 0) {
            const userRPC = new UserRPC(user);
            for (const actorID in this.videos) {
                if (this.videos.hasOwnProperty(actorID)) {
                    userRPC.emit('VideoPlay',
                        {
                            parentId: actorID,
                            URL: this.videos[actorID].URL,
                            startTime: this.videos[actorID].basisTime + Date.now() / 1000.0
                        });
                }
            }
        }
        this.userCount++;
    }

    private userLeft(user: User) {
        this.userCount--;
    }

    public Play(actorID: string, URL: string, startTime: number) {
        if (this.videos[actorID] === undefined || this.videos[actorID].URL !== URL) {
            this.videos[actorID] = { URL, basisTime: startTime - Date.now() / 1000.0 };
            if (this.userCount > 0) {
                this._RPC.emit('VideoPlay', { parentId: actorID, URL, startTime });
            }
        }
    }

    public Stop(actorID: string) {
        if (this.videos[actorID] !== undefined) {
            if (this.userCount > 0) {
                this._RPC.emit('VideoPlay', { parentId: actorID, URL: "", startTime: 0.0 });
            }
            delete this.videos[actorID];
        }
    }
}
