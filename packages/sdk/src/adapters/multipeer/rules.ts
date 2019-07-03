/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import deepmerge from 'deepmerge';
import { Client, Session, SynchronizationStage } from '.';
import { Message, WebSocket } from '../..';
import { log } from '../../log';
import { SoundCommand } from '../../sound';
import * as Payloads from '../../types/network/payloads';
import { ExportedPromise } from '../../utils/exportedPromise';

// tslint:disable:variable-name new-parens no-console

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
	},

	/**
	 * Message preprocessing applied by the Client class.
	 */
	client: {
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
			session: Session, client: Client, message: any, promise: ExportedPromise) => Message;
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
		shouldSendToUser: (message: any, userId: string, session: Session, client: Client) => boolean | null;
	},

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
	}
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
			const exclusiveUser = session.actorSet[message.payload.actor.id].exclusiveToUser;
			return exclusiveUser ? exclusiveUser === userId : null;
		}
	},
	session: {
		...DefaultRule.session,
		beforeReceiveFromApp: (
			session: Session,
			message: Message<Payloads.CreateEmpty>
		) => {
			session.cacheInitializeActorMessage(message);
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
					existingPayload.actor = deepmerge(existingPayload.actor,  {
						payload: {
							actor: {
								transform: {
									app: message.payload.appTransform
								}
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
				const syncActor = session.actorSet[message.payload.actorId];
				if (syncActor && (client.authoritative || syncActor.grabbedBy === client.id)) {
					const correctionPayload = message.payload;

					// Synthesize an actor update message and add in the transform from the correction payload.
					// Send this to the cacheActorUpdateMessage call.
					const updateMessage: Message<Payloads.ActorUpdate> = {
						payload: {
							actor: {
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
				const exclusiveUser = session.actorSet[message.payload.actor.id].exclusiveToUser;
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
				const syncActor = session.actorSet[message.payload.actor.id];
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
				session.cacheUpdateAssetMessage(message);
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
	'create-animation': {
		...DefaultRule,
		synchronization: {
			stage: 'create-animations',
			before: 'ignore',
			during: 'allow',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.CreateAnimation>, userId, session, client) => {
				const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.CreateAnimation>
			) => {
				const syncActor = session.actorSet[message.payload.actorId];
				if (syncActor) {
					const enabled = message.payload.initialState && !!message.payload.initialState.enabled;
					syncActor.createdAnimations = syncActor.createdAnimations || [];
					syncActor.createdAnimations.push({ message, enabled });
				}
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
				session.cacheCreateAssetMessage(message);
				return message;
			}
		}
	},

	// ========================================================================
	'create-empty': CreateActorRule,

	// ========================================================================
	'create-from-gltf': CreateActorRule,

	// ========================================================================
	'create-from-library': CreateActorRule,

	// ========================================================================
	'create-primitive': CreateActorRule,

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
					delete session.actorSet[actorId];
				}
				return message;
			}
		}
	},

	// ========================================================================
	'engine2app-rpc': ClientOnlyRule,

	// ========================================================================
	'handshake': ClientOnlyRule,

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
	},

	// ========================================================================
	'heartbeat-reply': ClientOnlyRule,

	// ========================================================================
	'interpolate-actor': {
		...DefaultRule,
		synchronization: {
			stage: 'create-animations',
			before: 'queue',
			during: 'allow',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.InterpolateActor>, userId, session, client) => {
				const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.InterpolateActor>
			) => {
				const syncActor = session.actorSet[message.payload.actorId];
				if (syncActor) {
					syncActor.activeInterpolations = syncActor.activeInterpolations || [];
					syncActor.activeInterpolations.push(deepmerge({}, message.payload));
				}
				return message;
			}
		}
	},

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
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.LoadAssets>
			) => {
				session.cacheCreateAssetMessage(message);
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
				const exclusiveUser = session.actorSet[message.payload.actors[0].id].exclusiveToUser;
				if (client.authoritative || client.userId && client.userId === exclusiveUser) {
					// Create no-op creation message. Implicit sync from initialization until they're updated
					for (const spawned of message.payload.actors) {
						session.cacheInitializeActorMessage({
							payload: {
								type: 'actor-update',
								actor: { id: spawned.id }
							}
						});
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
				const syncActor = session.actorSet[payload.targetId];
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
				const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
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
	'set-animation-state': {
		...DefaultRule,
		synchronization: {
			stage: 'create-animations',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.SetAnimationState>, userId, session, client) => {
				const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.SetAnimationState>
			) => {
				// If the app enabled or disabled the animation, update our local sync state to match.
				if (message.payload.state.enabled !== undefined) {
					const syncActor = session.actorSet[message.payload.actorId];
					if (syncActor) {
						const animation = session.findAnimation(syncActor, message.payload.animationName);
						if (animation) {
							animation.enabled = message.payload.state.enabled;
						}
					}
				}
				return message;
			},
			beforeReceiveFromClient: (
				session: Session,
				client: Client,
				message: Message<Payloads.SetAnimationState>
			) => {
				// Check that this is the authoritative client
				const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
				if (client.authoritative || client.userId && client.userId === exclusiveUser) {
					// Check that the actor exists.
					const syncActor = session.actorSet[message.payload.actorId];
					if (syncActor) {
						// If the animation was disabled on the client, notify other clients and also
						// update our local sync state.
						if (message.payload.state.enabled !== undefined && !message.payload.state.enabled) {
							const createdAnimation = (syncActor.createdAnimations || []).filter(
								item => item.message.payload.animationName === message.payload.animationName).shift();
							if (createdAnimation) {
								createdAnimation.enabled = message.payload.state.enabled;
								// Propagate to other clients.
								session.sendToClients(message, (value) => value.id !== client.id);
							}
							// Remove the completed interpolation.
							syncActor.activeInterpolations =
								(syncActor.activeInterpolations || []).filter(
									item => item.animationName !== message.payload.animationName);
						}
					}
					// Allow the message to propagate to the app.
					return message;
				}
			}
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
				const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.SetBehavior>
			) => {
				const syncActor = session.actorSet[message.payload.actorId];
				if (syncActor) {
					syncActor.behavior = message.payload.behaviorType;
				} else {
					console.log(`[ERROR] Sync: set-behavior on unknown actor ${message.payload.actorId}`);
				}
				return message;
			}
		}
	},

	// ========================================================================
	'set-sound-state': {
		...DefaultRule,
		synchronization: {
			stage: 'active-sound-instances',
			before: 'ignore',
			during: 'queue',
			after: 'allow'
		},
		client: {
			...DefaultRule.client,
			shouldSendToUser: (message: Message<Payloads.SetSoundState>, userId, session, client) => {
				const exclusiveUser = session.actorSet[message.payload.actorId].exclusiveToUser;
				return exclusiveUser ? exclusiveUser === userId : null;
			}
		},
		session: {
			...DefaultRule.session,
			beforeReceiveFromApp: (
				session: Session,
				message: Message<Payloads.SetSoundState>
			) => {
				const syncActor = session.actorSet[message.payload.actorId];
				if (syncActor) {
					syncActor.activeSoundInstances = syncActor.activeSoundInstances || [];

					const basisTime = Date.now() / 1000.0;
					if (message.payload.soundCommand === SoundCommand.Start) {
						syncActor.activeSoundInstances.push({ message, basisTime });
					} else {
						// find the existing message that needs to be updated
						const activeSoundInstance = syncActor.activeSoundInstances.filter(
							item => item.message.payload.id === message.payload.id).shift();

						// if sound expired then skip this message completely
						if (!activeSoundInstance) {
							return undefined;
						}
						// Remove the existing sound instance (we'll add an updated one below).
						syncActor.activeSoundInstances =
							syncActor.activeSoundInstances.filter(
								item => item.message.payload.id !== message.payload.id);

						// store the updated sound instance if sound isn't stopping
						if (message.payload.soundCommand !== SoundCommand.Stop) {

							// update startimeoffset and update basistime in oldmessage.
							const targetTime = Date.now() / 1000.0;
							if (activeSoundInstance.message.payload.options.paused !== true) {
								let timeOffset = (targetTime - activeSoundInstance.basisTime);
								if (activeSoundInstance.message.payload.options.pitch !== undefined) {
									timeOffset *= Math.pow(2.0,
										(activeSoundInstance.message.payload.options.pitch / 12.0));
								}
								if (activeSoundInstance.message.payload.startTimeOffset === undefined) {
									activeSoundInstance.message.payload.startTimeOffset = 0.0;
								}
								activeSoundInstance.message.payload.startTimeOffset += timeOffset;
							}

							// merge existing message and new message
							activeSoundInstance.message.payload.options = {
								...activeSoundInstance.message.payload.options,
								...message.payload.options
							};
							syncActor.activeSoundInstances.push({ message: activeSoundInstance.message, basisTime });
						}
					}

				}
				return message;
			}
		}

	},

	// ========================================================================
	'sync-animations': {
		...DefaultRule,
		synchronization: {
			stage: 'sync-animations',
			before: 'error',
			during: 'allow',
			after: 'error'
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
	'trigger-event-raised': {
		...ClientOnlyRule
	},

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
				for (const assetId of message.payload.assetIds) {
					delete session.assetUpdateSet[assetId];
					// TODO: Delete creation message if unloading all its assets
				}
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
	}
};
