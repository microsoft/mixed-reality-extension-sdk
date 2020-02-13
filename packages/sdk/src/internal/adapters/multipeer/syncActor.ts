/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BehaviorType, Guid } from '../../..';
import { Message, Payloads } from '../../../internal';

/** @hidden */
export type InitializeActorMessage = Message<Payloads.CreateActorCommon | Payloads.ActorUpdate>;

/**
 * @hidden
 */
export type InitializeActor = {
	message: InitializeActorMessage;
};

/**
 * @hidden
 */
export type CreateAnimation = {
	message: Message<Payloads.CreateAnimation>;
	enabled: boolean;
};

/**
 * @hidden
 */
export type ActiveMediaInstance = {
	message: Message<Payloads.SetMediaState>;
	basisTime: number;
	expirationTime: number;
};

/**
 * @hidden
 */
export type SyncActor = {
	actorId: Guid;
	initialization: InitializeActor;
	createdAnimations: CreateAnimation[];
	activeMediaInstances: ActiveMediaInstance[];
	activeInterpolations: Payloads.InterpolateActor[];
	behavior: BehaviorType;
	grabbedBy: Guid;
	exclusiveToUser: Guid;
};
