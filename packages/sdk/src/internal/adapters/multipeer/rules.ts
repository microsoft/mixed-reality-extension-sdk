/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import deepmerge from 'deepmerge';

import {
	ActiveMediaInstance,
	Client,
	ExportedPromise,
	Message,
	Payloads,
	Session,
	SynchronizationStage,
	WebSocket
} from '../../../internal';
import { Guid, log, MediaCommand } from '../../..';

/**
 * @hidden
 * Indicates how to handle live message traffic during the client join process.
 */
export type MessageHandling =
	/**
	 * Ignore the message.
	 */
	'ignore' |
	/**
	 * Queue message for later delivery.
	 */
	'queue' |
	/**
	 * Allow the message to be sent.
	 */
	'allow' |
	/**
	 * Trying to send this message indicates an operational error.
	 */
	'error';

/**
 * @hidden
 * Defines how specific messages are processed by different parts of the multipeer adapter.
 */
export type Rule = {
	/**
	 * During synchronization, apply these rules to outgoing messages.
	 */
	synchronization: {
		/**
		 * `stage` - The synchronization stage that serves as the inflection point for this message.
		 */
		stage: SynchronizationStage;
		/**
		 * `before` - How to handle outgoing messages of this type before `stage` has begun.
		 */
		before: MessageHandling;
		/**
		 * `during` - How to handle outgoing messages of this type while `stage` is active.
		 */
		during: MessageHandling;
		/**
		 * `after` - How to handle outgoing messages of this type after `stage` is complete.
		 */
		after: MessageHandling;
	};

	/**
	 * Message preprocessing applied by the Client class.
	 */
	client: {
		/**
		 * If non-zero, a timeout will be set for this message. If we don't receive a reply before the
		 * timeout expires, the client connection will be closed. Only applicable to messages expecting
		 * replies.
		 */
		timeoutSeconds: number;
		/**
		 * Called before a message is queued for later delivery to a client.
		 * @param session The current session.
		 * @param client The client to receive the message.
		 * @param message The message to queue.
		 * @param promise Optional promise to complete once the reply message is received.
		 * @returns Return the message if you want it to continue to be processed. Return null/undefined
		 * to stop processing of the message.
		 */
		beforeQueueMessageForClient: (
			session: Session, client: Client, message: Message<any>, promise: ExportedPromise) => Message;
		/**
		 * Called twice before a message is sent: first to determine if a message is user-dependent
		 * (it is queued until user-join if so), and second to determine if the joined user is the
		 * correct user.
		 * @param message The message to be checked
		 * @param userId A GUID to a (possibly unjoined) user
		 * @param session The current session.
		 * @param client The client to send the message
		 * @returns `null` if the message does not depend on a user, `true` if it depends on the given
		 * user, and `false` if it depends on a different user.
		 */
		shouldSendToUser: (message: Message<any>, userId: Guid, session: Session, client: Client) => boolean | null;
	};

	/**
	 * Message preprocessing applied by the Session class.
	 */
	session: {
		/**
		 * Called after a message is received from the app, before propagating the message.
		 * @param session The current session.
		 * @param message The message.
		 * @returns Return the message if you want it to continue to be processed. Return a falsy value
		 * to stop processing of the message.
		 */
		beforeReceiveFromApp: (
			session: Session, message: any) => Message;
		/**
		 * Called after a message is received from a client, before propagating the message.
		 * @param session The current session.
		 * @param client The client who sent the message.
		 * @param message The message itself (also contains the payload).
		 * @returns Return the message if you want it to continue to be processed. Return a falsy value
		 * to stop processing of the message.
		 */
		beforeReceiveFromClient: (
			session: Session, client: Client, message: any) => Message;
	};
};

/**
 * @hidden
 * The DefaultRule provides reasonable default rule settings, ensuring all fields are assigned.
 */
export const DefaultRule: Rule = {
	synchronization: {
		stage: 'always',
		before: 'allow',
		during: 'allow',
		after: 'allow'
	},
	client: {
		timeoutSeconds: 0,
		beforeQueueMessageForClient: (
			session: Session, client: Client, message: any, promise: ExportedPromise) => {
			return message;
		},
		shouldSendToUser: () => null,
	},
	session: {
		beforeReceiveFromApp: (
			session: Session, message: Message) => {
			return message;
		},
		beforeReceiveFromClient: (
			session: Session, client: Client, message: Message) => {
			return message;
		}
	}
};

/**
 * @hidden
 * MissingRule alerts the SDK developer that they need to define a Rule for the payload.
 */
export const MissingRule: Rule = {
	...DefaultRule,
	client: {
		...DefaultRule.client,
		beforeQueueMessageForClient: (
			session: Session, client: Client, message: any, promise: ExportedPromise) => {
			log.error('app', `[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
			return message;
		}
	},
	session: {
		...DefaultRule.session,
		beforeReceiveFromApp: (
			session: Session, message: Message) => {
			log.error('app', `[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
			return message;
		},
		beforeReceiveFromClient: (
			session: Session, client: Client, message: Message) => {
			log.error('app', `[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
			return message;
		},
	}
};

/**
 * @hidden
 * Handling for client-only messages.
 */
const ClientOnlyRule: Rule = {
	...DefaultRule,
	synchronization: {
		stage: 'always',
		before: 'error',
		during: 'error',
		after: 'error'
	},
	client: {
		...DefaultRule.client,
		beforeQueueMessageForClient: (
			session: Session, client: Client, message: any, promise: ExportedPromise) => {
			log.error('network', `[ERROR] session tried to queue a client-only message: ${message.payload.type}!`);
			return message;
		}
	},
	session: {
		...DefaultRule.session,
		beforeReceiveFromApp: (session: Session, message: Message) => {
			log.error('network', `[ERROR] app tried to send a client-only message: ${message.payload.type}!`);
			return undefined;
		}
	}
};

/**
 * @hidden
 * Handling for actor creation messages
 */
const CreateActorRule: Rule = {
	...DefaultRule,
	synchronization: {
		stage: 'create-actors',
		before: 'ignore',
		during: 'queue',
		after: 'allow'
	},
	client: {
		...DefaultRule.client,
		shouldSendToUser: (message: Message<Payloads.CreateActorCommon>, userId, session, client) => {
			const exclusiveUser = session.actorSet.get(message.payload.actor.id).exclusiveToUser;
			return exclusiveUser ? exclusiveUser === userId : null;
		}
	},
	session: {
		...DefaultRule.session,
		beforeReceiveFromApp: (
			session: Session,
			message: Message<Payloads.CreateActorCommon>
		) => {
			session.cacheInitializeActorMessage(message);
			session.cacheAnimationCreationRequest(message);
			return message;
		}
	}
};

/**
 * @hidden
 * A global collection of message rules used by different parts of the multipeer adapter.
 * Getting a compiler error here? It is likely that `Rules` is missing a rule for the new payload type you added.
 * *** KEEP ENTRIES SORTED ***
 */
export const Rules: { [id in Payloads.PayloadType]: Rule } = {
	// ========================================================================
	'actor-correction': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			beforeQueueMessageForClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.ActorCorrection>,
				promise: ExportedPromise
			) => {
				// Coalesce this actor correction with the previously queued update if it exists, maintaining a single
				// update for this actor rather than queuing a series of them.  This is fine, as we do not need to lerp
				// an actor correction on a late join user.  It can just be the updated actor values.
				const payload = message.payload;
				const queuedMessage = client.queuedMessages
					.filter(value =>
						value.message.payload.type === 'actor-update' &&
						(value.message.payload as Payloads.ActorUpdate).actor.id === payload.actorId).shift();
				if (queuedMessage) {
					const existingPayload = queuedMessage.message.payload as Partial<Payloads.ActorUpdate>;
					existingPayload.actor = deepmerge(existingPayload.actor, {
						actor: {
							transform: {
								app: message.payload.appTransform
							}
						}
					});

					// We have merged the actor correction in to an existing actor update.  We do not want to
					// propagate the correction message further.
					return undefined;
				}
				return message;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.ActorCorrection>
			) => {
				const syncActor = session.actorSet.get(message.payload.actorId);
				if (syncActor && (client.authoritative || syncActor.grabbedBy === client.id)) {
					const correctionPayload = message.payload;

					// Synthesize an actor update message and add in the transform from the correction payload.
					// Send this to the cacheActorUpdateMessage call.
					const updateMessage: Message<Payloads.ActorUpdate> = {
						payload: {
							type: 'actor-update',
							actor: {
								id: correctionPayload.actorId,
								transform: {
									app: correctionPayload.appTransform
								}
							}
						}
					};

					// Merge the update into the existing actor.
					session.cacheActorUpdateMessage(updateMessage);

					// Sync the change to the other clients.
					session.sendPayloadToClients(correctionPayload, (value) => value.id !== client.id);

					// Determine whether to forward the message to the app based on subscriptions.
					let shouldSendToApp = false;
					const subscriptions = syncActor.initialization.message.payload.actor.subscriptions || [];
					if (correctionPayload.appTransform &&
						Object.keys(correctionPayload.appTransform) &&
						subscriptions.includes('transform')) {
						shouldSendToApp = true;
					}

					// If we should sent to the app, then send the synthesized actor update instead, as correction
					// messages are just for clients.
					return shouldSendToApp ? updateMessage : undefined;
				}
			}
		}
	},

	// ========================================================================
	'actor-update': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			beforeQueueMessageForClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.ActorUpdate>,
				promise: ExportedPromise
			) => {
				// Coalesce this update with the previously queued update if it exists, maintaining a single
				// update for this actor rather than queuing a series of them.
				const payload = message.payload;
				const queuedMessage = client.queuedMessages
					.filter(value =>
						value.message.payload.type === 'actor-update' &&
						(value.message.payload as Payloads.ActorUpdate).actor.id === payload.actor.id).shift();
				if (queuedMessage) {
					const existingPayload = queuedMessage.message.payload as Partial<Payloads.ActorUpdate>;
					existingPayload.actor = deepmerge(existingPayload.actor, payload.actor);

					// We have merged the actor update in to an existing actor update.  We do not want to
					// propagate the update message further.
					return undefined;
				}
				return message;
			},
			shouldSendToUser: (message: Message<Payloads.ActorUpdate>, userId, session, client) => {
				const exclusiveUser = session.actorSet.get(message.payload.actor.id).exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.ActorUpdate>
			) => {
				session.cacheActorUpdateMessage(message);
				return message;
			},
			beforeReceiveFromClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.ActorUpdate>
			) => {
				const syncActor = session.actorSet.get(message.payload.actor.id);
				if (syncActor && (client.authoritative || syncActor.grabbedBy === client.id)) {
					// Merge the update into the existing actor.
					session.cacheActorUpdateMessage(message);

					// Make a copy of the message so we can modify it.
					const payloadForClients = deepmerge(message.payload, {});

					// If animating, don't sync transform changes with other clients (animations are desynchronized)
					if (session.isAnimating(syncActor)) {
						delete payloadForClients.actor.transform;
					}

					// Don't sync to other clients if the actor patch is empty.
					// (if keys.length === 1, it only contains the actor.id field)
					if (Object.keys(payloadForClients.actor).length > 1) {
						// Sync the change to the other clients.
						session.sendPayloadToClients(payloadForClients, (value) => value.id !== client.id);
					}

					// Determine whether to forward the message to the app based on subscriptions.
					let shouldSendToApp = false;
					const subscriptions = syncActor.initialization.message.payload.actor.subscriptions || [];
					if (message.payload.actor.transform &&
						Object.keys(message.payload.actor.transform) &&
						subscriptions.includes('transform')) {
						shouldSendToApp = true;
					} else if (message.payload.actor.rigidBody &&
						Object.keys(message.payload.actor.rigidBody) &&
						subscriptions.includes('rigidbody')) {
						shouldSendToApp = true;
					}

					return shouldSendToApp ? message : undefined;
				}
			}
		}
	},

	// ========================================================================
	'animation-update': {
		...DefaultRule,
		synchronization: {
			stage: 'sync-animations',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.AnimationUpdate>, userId, session: Session) => {
				// TODO: don't send animation updates when the animation targets only actors
				// the client doesn't care/know about.
				return true;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.AnimationUpdate>
			) => {
				session.cacheAnimationUpdate(message);
				return message;
			}
		}
	},

	// ========================================================================
	'app2engine-rpc': {
		...DefaultRule,
		synchronization: {
			stage: 'always',
			before: 'queue',
			during: 'queue',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.AppToEngineRPC>, userId, session, client) => {
				// If the AppToEngineRPC message targets a specific user, filter to that user.
				const exclusiveUser = message.payload.userId;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		}
	},

	// ========================================================================
	'asset-update': {
		...DefaultRule,
		synchronization: {
			stage: 'load-assets',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.AssetUpdate>
			) => {
				session.cacheAssetUpdate(message);
				return message;
			}
		}
	},

	// ========================================================================
	'assets-loaded': {
		...ClientOnlyRule,
		session: {
			...ClientOnlyRule.session,
			beforeReceiveFromClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.AssetsLoaded>
			) => {
				if (client.authoritative) {
					for (const asset of message.payload.assets) {
						session.cacheAssetCreation(asset.id, message.replyToId,
							(asset.sound && asset.sound.duration) ||
							(asset.videoStream && asset.videoStream.duration));
					}
					return message;
				} else if (message.payload.failureMessage && message.payload.failureMessage.length) {
					// TODO: Propagate to app as a general failure message once
					// we have created the error event handler message path.
				}
			}
		}
	},

	// ========================================================================
	'collision-event-raised': {
		...ClientOnlyRule
	},

	// ========================================================================
	'create-animation-2': {
		...DefaultRule,
		synchronization: {
			stage: 'create-animations',
			before: 'ignore',
			during: 'allow',
			after: 'allow'
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.CreateAnimation2>
			) => {
				session.cacheAnimationCreationRequest(message);
				return message;
			}
		}
	},

	// ========================================================================
	'create-asset': {
		...DefaultRule,
		synchronization: {
			stage: 'load-assets',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.CreateAsset>
			) => {
				session.cacheAssetCreationRequest(message);
				return message;
			}
		}
	},

	// ========================================================================
	'create-empty': CreateActorRule,

	// ========================================================================
	'create-from-library': CreateActorRule,

	// ========================================================================
	'create-from-prefab': CreateActorRule,

	// ========================================================================
	'destroy-actors': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.DestroyActors>
			) => {
				for (const actorId of message.payload.actorIds) {
					session.actorSet.delete(actorId);
				}
				return message;
			}
		}
	},

	// ========================================================================
	'dialog-response': ClientOnlyRule,

	// ========================================================================
	'engine2app-rpc': ClientOnlyRule,

	// ========================================================================
	'handshake': {
		...ClientOnlyRule,
		client: {
			...ClientOnlyRule.client,
			timeoutSeconds: 30
		},
	},

	// ========================================================================
	'handshake-complete': ClientOnlyRule,

	// ========================================================================
	'handshake-reply': {
		...DefaultRule,
		synchronization: {
			stage: 'always',
			before: 'error',
			during: 'error',
			after: 'error'
		}
	},

	// ========================================================================
	'heartbeat': {
		...DefaultRule,
		synchronization: {
			stage: 'always',
			before: 'allow',
			during: 'allow',
			after: 'allow',
		},
		client: {
			...DefaultRule.client,
			timeoutSeconds: 30
		}
	},

	// ========================================================================
	'heartbeat-reply': ClientOnlyRule,

	// ========================================================================
	'load-assets': {
		...DefaultRule,
		synchronization: {
			stage: 'load-assets',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (session, message) => {
				session.cacheAssetCreationRequest(message);
				return message;
			}
		}
	},

	// ========================================================================
	'multi-operation-result': ClientOnlyRule,

	// ========================================================================
	'object-spawned': {
		...ClientOnlyRule,
		session: {
			...DefaultRule.session,
			beforeReceiveFromClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.ObjectSpawned>
			) => {
				// Check that this is the authoritative client
				const actors = message.payload.actors;
				const exclusiveUser = actors?.length > 0 && session.actorSet.has(actors[0]?.id) ?
					session.actorSet.get(actors[0].id).exclusiveToUser :
					undefined;
				if (client.authoritative || client.userId && client.userId === exclusiveUser) {
					// Create no-op creation message. Implicit sync from initialization until they're updated
					for (const spawned of message.payload.actors || []) {
						session.cacheInitializeActorMessage({
							payload: {
								type: 'actor-update',
								actor: { id: spawned.id }
							}
						});
					}
					// create somewhere to store anim updates
					for (const newAnim of message.payload.animations || []) {
						session.cacheAnimationCreation(message.replyToId, newAnim);
					}
					// Allow the message to propagate to the app.
					return message;
				}
			}
		}
	},

	// ========================================================================
	'operation-result': {
		...ClientOnlyRule,
		session: {
			...DefaultRule.session
		}
	},

	// ========================================================================
	'perform-action': {
		...ClientOnlyRule,
		session: {
			...DefaultRule.session,
			beforeReceiveFromClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.PerformAction>
			) => {
				// Store the client id of the client that is performing the grab.
				const payload = message.payload;
				const syncActor = session.actorSet.get(payload.targetId);
				if (syncActor && payload.actionName.toLowerCase() === 'grab' &&
					(syncActor.grabbedBy === client.id || syncActor.grabbedBy === undefined)
				) {
					syncActor.grabbedBy = payload.actionState === 'started' ? client.id : undefined;
				}

				return message;
			}
		}
	},

	// ========================================================================
	'rigidbody-add-force': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'queue',
			during: 'queue',
			after: 'allow'
		}
	},

	// ========================================================================
	'rigidbody-add-force-at-position': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'queue',
			during: 'queue',
			after: 'allow'
		}
	},

	// ========================================================================
	'rigidbody-add-relative-torque': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'queue',
			during: 'queue',
			after: 'allow'
		}
	},

	// ========================================================================
	'rigidbody-add-torque': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'queue',
			during: 'queue',
			after: 'allow'
		}
	},

	// ========================================================================
	'rigidbody-commands': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'queue',
			during: 'queue',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.RigidBodyCommands>, userId, session, client) => {
				const exclusiveUser = session.actorSet.get(message.payload.actorId).exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		}
	},

	// ========================================================================
	'rigidbody-move-position': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'queue',
			during: 'queue',
			after: 'allow'
		}
	},

	// ========================================================================
	'rigidbody-move-rotation': {
		...DefaultRule,
		synchronization: {
			stage: 'create-actors',
			before: 'queue',
			during: 'queue',
			after: 'allow'
		}
	},

	// ========================================================================
	'set-authoritative': {
		...DefaultRule,
		synchronization: {
			stage: 'always',
			before: 'error',
			during: 'error',
			after: 'error'
		}
	},

	// ========================================================================
	'set-behavior': {
		...DefaultRule,
		synchronization: {
			stage: 'set-behaviors',
			before: 'ignore',
			during: 'allow',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.SetBehavior>, userId, session, client) => {
				const exclusiveUser = session.actorSet.get(message.payload.actorId).exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.SetBehavior>
			) => {
				const syncActor = session.actorSet.get(message.payload.actorId);
				if (syncActor) {
					syncActor.behavior = message.payload.behaviorType;
				} else {
					log.error('app', `Sync: set-behavior on unknown actor ${message.payload.actorId}`);
				}
				return message;
			}
		}
	},

	// ========================================================================
	'set-media-state': {
		...DefaultRule,
		synchronization: {
			stage: 'active-media-instances',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.SetMediaState>, userId, session, client) => {
				const exclusiveUser = session.actorSet.get(message.payload.actorId).exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.SetMediaState>
			) => {
				const syncActor = session.actorSet.get(message.payload.actorId);
				if (syncActor) {
					syncActor.activeMediaInstances = syncActor.activeMediaInstances || [];
					let activeMediaInstance: ActiveMediaInstance;
					const basisTime = Date.now() / 1000.0;

					if (message.payload.mediaCommand === MediaCommand.Start) {
						// Garbage collect expired media instances when adding a new media instance on an actor
						syncActor.activeMediaInstances = syncActor.activeMediaInstances.filter(
							item => item.expirationTime === undefined ||
								basisTime <= item.expirationTime);

						// Prepare the new media instance
						activeMediaInstance = { message, basisTime, expirationTime: undefined };
					} else {
						// find the existing message that needs to be updated
						activeMediaInstance = syncActor.activeMediaInstances.filter(
							item => item.message.payload.id === message.payload.id).shift();

						// if sound expired then skip this message completely
						if (!activeMediaInstance) {
							return undefined;
						}
						// Remove the existing sound instance (we'll add an updated one below).
						syncActor.activeMediaInstances =
							syncActor.activeMediaInstances.filter(
								item => item.message.payload.id !== message.payload.id);

						if (activeMediaInstance.expirationTime !== undefined) {
							if (basisTime > activeMediaInstance.expirationTime) {
								// non-looping mediainstance has completed, so ignore it, which will remove it
								// from the list
								return undefined;
							}
						}

						// store the updated sound instance if sound isn't stopping
						if (message.payload.mediaCommand === MediaCommand.Stop) {
							return message;
						}

						// if speed or position changes, reset basistime and recalculate the time.
						if (message.payload.options.time !== undefined) {
							// a time change(seek) just needs to reset basis time. The payload merge does the rest
							activeMediaInstance.basisTime = basisTime;
						} else if (message.payload.options.paused !== undefined ||
							message.payload.options.pitch !== undefined) {
							// if the media instance wasn't paused, then recalculate the current time
							// if media instance was paused then current time doesn't change
							if (activeMediaInstance.message.payload.options.paused !== true) {
								if (activeMediaInstance.message.payload.options.time === undefined) {
									activeMediaInstance.message.payload.options.time = 0.0;
								}
								let timeOffset = (basisTime - activeMediaInstance.basisTime);
								if (activeMediaInstance.message.payload.options.pitch !== undefined) {
									timeOffset *= Math.pow(2.0,
										(activeMediaInstance.message.payload.options.pitch / 12.0));
								}
								activeMediaInstance.message.payload.options.time += timeOffset;
							}
							activeMediaInstance.basisTime = basisTime;

						}

						// merge existing payload and new payload
						activeMediaInstance.message.payload.options = {
							...activeMediaInstance.message.payload.options,
							...message.payload.options
						};
					}

					// Look up asset duration from cached assets
					const asset = session.assetSet.get(message.payload.mediaAssetId);

					if (activeMediaInstance.message.payload.options.looping === true ||
						activeMediaInstance.message.payload.options.paused === true ||
						(asset === undefined || asset.duration === undefined)) {
						// media instance current will last forever
						activeMediaInstance.expirationTime = undefined;
					} else {
						// media instance will expire automatically
						let timeRemaining: number = asset.duration;
						if (activeMediaInstance.message.payload.options.time !== undefined) {
							timeRemaining -= activeMediaInstance.message.payload.options.time;
						}
						if (activeMediaInstance.message.payload.options.pitch !== undefined) {
							timeRemaining /= Math.pow(2.0,
								(activeMediaInstance.message.payload.options.pitch / 12.0));
						}
						activeMediaInstance.expirationTime = basisTime + timeRemaining;
					}

					syncActor.activeMediaInstances.push(activeMediaInstance);
				}

				return message;
			}
		}
	},

	// ========================================================================
	'show-dialog': {
		...DefaultRule,
		synchronization: {
			stage: 'never',
			before: 'ignore',
			during: 'ignore',
			after: 'ignore'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.ShowDialog>, userId) => {
				return message.payload.userId === userId;
			}
		}
	},

	// ========================================================================
	'sync-complete': {
		...DefaultRule,
		synchronization: {
			stage: 'always',
			before: 'error',
			during: 'error',
			after: 'allow'
		}
	},

	// ========================================================================
	'sync-request': ClientOnlyRule,

	// ========================================================================
	'traces': ClientOnlyRule,

	// ========================================================================
	'trigger-event-raised': ClientOnlyRule,

	// ========================================================================
	'unload-assets': {
		...DefaultRule,
		synchronization: {
			stage: 'load-assets',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.UnloadAssets>
			) => {
				session.cacheAssetUnload(message.payload.containerId);
				return message;
			}
		}
	},

	// ========================================================================
	'user-joined': {
		...ClientOnlyRule,
		session: {
			...ClientOnlyRule.session,
			beforeReceiveFromClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.UserJoined>
			) => {
				// Add remote ip address to the joining user.
				const props = message.payload.user.properties = message.payload.user.properties || {};
				if (client.conn instanceof WebSocket && !props.remoteAddress) {
					props.remoteAddress = client.conn.remoteAddress;
				}

				return message;
			}
		}
	},

	// ========================================================================
	'user-left': ClientOnlyRule,

	// ========================================================================
	'user-update': {
		...DefaultRule,
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (session, message: Message<Payloads.UserUpdate>) => {
				const client = session.clients.find(c => c.userId === message.payload.user.id);
				if (client) {
					client.send(message);
				}
				return null;
			}
		}
	},

	// ========================================================================
	'x-reserve-actor': {
		...DefaultRule,
		synchronization: {
			stage: 'never',
			before: 'ignore',
			during: 'ignore',
			after: 'ignore'
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (session: Session, message: Message<Payloads.XReserveActor>) => {
				session.cacheInitializeActorMessage(message);
				return null;
			}
		}
	}
};
