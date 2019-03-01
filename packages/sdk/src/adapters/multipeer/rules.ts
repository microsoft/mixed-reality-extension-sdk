/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import deepmerge from 'deepmerge';
import { Client, Session, SynchronizationStage } from '.';
import { Message, WebSocket } from '../..';
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
        }
    },
    session: {
        beforeReceiveFromApp: (
            session: Session, message: Message) => {
            return message;
        },
        beforeReceiveFromClient: (
            session: Session, client: Client, message: Message) => {
            return message;
        },
    }
};

/**
 * @hidden
 * MissingRule alerts the SDK developer that they need to define a Rule for the payload.
 */
export const MissingRule: Rule = {
    ...DefaultRule,
    client: {
        beforeQueueMessageForClient: (
            session: Session, client: Client, message: any, promise: ExportedPromise) => {
            console.error(`[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
            return message;
        }
    },
    session: {
        beforeReceiveFromApp: (
            session: Session, message: Message) => {
            console.error(`[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
            return message;
        },
        beforeReceiveFromClient: (
            session: Session, client: Client, message: Message) => {
            console.error(`[ERROR] No rule defined for payload ${message.payload.type}! Add an entry in rules.ts.`);
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
        beforeQueueMessageForClient: (
            session: Session, client: Client, message: any, promise: ExportedPromise) => {
            console.error(`[ERROR] session tried to queue a client-only message: ${message.payload.type}!`);
            return message;
        }
    },
    session: {
        ...DefaultRule.session,
        beforeReceiveFromApp: (session: Session, message: Message) => {
            console.error(`[ERROR] app tried to send a client-only message: ${message.payload.type}!`);
            return undefined;
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
            beforeQueueMessageForClient: (
                session: Session,
                client: Client,
                message: Message,
                promise: ExportedPromise
            ) => {
                message.payload.type = 'actor-update';
                client.queueMessage(message, promise);
                return undefined;
            }
        },
        session: {
            // Whenever we encounter an actor-correction, convert it to an actor-update
            // Eventually: Remove actor-correction payload type (requires DLL change).
            beforeReceiveFromApp: (
                session: Session,
                message: Message<Payloads.ActorUpdate>
            ) => {
                message.payload.type = 'actor-update';
                session.preprocessFromApp(message);
                return undefined;
            },
            beforeReceiveFromClient: (
                session: Session,
                client: Client,
                message: Message<Payloads.ActorUpdate>
            ) => {
                message.payload.type = 'actor-update';
                session.preprocessFromClient(client, message);
                return undefined;
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
                    return undefined;
                }
                return message;
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
                // Check that this is the authoritative client.
                if (client.authoritative) {
                    // Check that the actor exists.
                    const syncActor = session.actorSet[message.payload.actor.id];
                    if (syncActor) {
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
                        const subscriptions = syncActor.created.message.payload.actor.subscriptions || [];
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
        session: {
            ...DefaultRule.session,
            beforeReceiveFromApp: (
                session: Session,
                message: Message<Payloads.AppToEngineRPC>
            ) => {
                // Send the message only to the specified user.
                if (message.payload.userId) {
                    const client = session.clients.find(value => value.userId === message.payload.userId);
                    if (client) {
                        client.send(message);
                    }
                } else {
                    // If no user specified then allow the message to be sent to all users.
                    return message;
                }
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
                session.cacheAssetUpdateMessage(message);
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
    'create-animation': {
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
                session.cacheAssetCreationMessage(message);
                return message;
            }
        }
    },

    // ========================================================================
    'create-empty': {
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
                message: Message<Payloads.CreateEmpty>
            ) => {
                session.cacheCreateActorMessage(message);
                return message;
            }
        }
    },

    // ========================================================================
    'create-from-gltf': {
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
                message: Message<Payloads.CreateFromGltf>
            ) => {
                session.cacheCreateActorMessage(message);
                return message;
            }
        }
    },

    // ========================================================================
    'create-from-library': {
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
                message: Message<Payloads.CreateFromLibrary>
            ) => {
                session.cacheCreateActorMessage(message);
                return message;
            }
        }
    },

    // ========================================================================
    'create-primitive': {
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
                message: Message<Payloads.CreatePrimitive>
            ) => {
                session.cacheCreateActorMessage(message);
                return message;
            }
        }
    },

    // ========================================================================
    'create-from-prefab': {
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
                message: Message<Payloads.CreateFromPrefab>
            ) => {
                session.cacheCreateActorMessage(message);
                return message;
            }
        }
    },

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
    'engine2app-rpc': {
        ...ClientOnlyRule
    },

    // ========================================================================
    'handshake': {
        ...ClientOnlyRule
    },

    // ========================================================================
    'handshake-complete': {
        ...ClientOnlyRule
    },

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
    'heartbeat-reply': {
        ...ClientOnlyRule
    },

    // ========================================================================
    'interpolate-actor': {
        ...DefaultRule,
        synchronization: {
            stage: 'create-animations',
            before: 'ignore',
            during: 'queue',
            after: 'allow'
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
                session.cacheAssetCreationMessage(message);
                return message;
            }
        }
    },

    // ========================================================================
    'look-at': {
        ...DefaultRule,
        synchronization: {
            stage: 'create-actors',
            before: 'queue',
            during: 'queue',
            after: 'allow'
        }
    },

    // ========================================================================
    'multi-operation-result': {
        ...ClientOnlyRule
    },

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
                // Check that this is the authoritative client.
                if (client.authoritative) {
                    // Create local representations of the actors.
                    for (const spawned of message.payload.actors) {
                        let syncActor = session.actorSet[spawned.id];
                        if (!syncActor) {
                            syncActor = session.actorSet[spawned.id] = {
                                created: {
                                    message: {
                                        payload: {
                                            actor: spawned
                                        }
                                    } as Message<Payloads.CreateActorCommon>
                                }
                            };
                            syncActor.actorId = spawned.id;
                        }
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
            ...DefaultRule.session,
            beforeReceiveFromClient: (
                session: Session,
                client: Client,
                message: Message<Payloads.OperationResult>
            ) => {
                if (client.authoritative) {
                    // Allow the message to propagate to the app.
                    return message;
                }
            }
        }
    },

    // ========================================================================
    'perform-action': {
        ...ClientOnlyRule
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
                // Check that this is the authoritative client.
                if (client.authoritative) {
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
            during: 'queue',
            after: 'allow'
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
        session: {
            ...DefaultRule.session,
            beforeReceiveFromApp: (
                session: Session,
                message: Message<Payloads.SetSoundState>
            ) => {
                const syncActor = session.actorSet[message.payload.actorId];
                if (syncActor) {
                    syncActor.activeSoundInstances = syncActor.activeSoundInstances || [];

                    const newMessage = message;
                    const basisTime = Date.now() / 1000.0;
                    if (message.payload.soundCommand !== SoundCommand.Start) {
                        // find the existing message that needs to be updated
                        const activeSoundInstance = (syncActor.activeSoundInstances || []).filter(
                            item => item.message.payload.id === message.payload.id).shift();
                        // if sound expired then skip this message completely
                        if (!activeSoundInstance) {
                            return undefined;
                        }
                        // Remove the existing sound instance (we'll add an updated one later if needed).
                        syncActor.activeSoundInstances =
                            (syncActor.activeSoundInstances || []).filter(
                                item => item.message.payload.id !== message.payload.id);

                        // update startimeoffset and update basistime in oldmessage.
                        const targetTime = Date.now() / 1000.0;
                        if (activeSoundInstance.message.payload.soundCommand !== SoundCommand.Pause) {
                            let timeOffset = (targetTime - activeSoundInstance.basisTime);
                            if (activeSoundInstance.message.payload.options.pitch !== undefined) {
                                timeOffset *= Math.pow(2.0, (activeSoundInstance.message.payload.options.pitch / 12.0));
                            }
                            if (activeSoundInstance.message.payload.startTimeOffset === undefined) {
                                activeSoundInstance.message.payload.startTimeOffset = 0.0;
                            }
                            activeSoundInstance.message.payload.startTimeOffset += timeOffset;
                        }

                        // merge existing message and new message
                        newMessage.payload.options = {
                            ...activeSoundInstance.message.payload.options,
                            ...newMessage.payload.options
                        };
                        if (newMessage.payload.soundCommand !== undefined) {
                            activeSoundInstance.message.payload.soundCommand = newMessage.payload.soundCommand;
                        }
                        newMessage.payload.startTimeOffset = activeSoundInstance.message.payload.startTimeOffset;

                    }
                    // TODO V2: Check if single-shot sound is past the end, and if so, skip this message

                    if (message.payload.soundCommand !== SoundCommand.Stop) {
                        syncActor.activeSoundInstances.push({ message: newMessage, basisTime });
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
    'sync-request': {
        ...ClientOnlyRule
    },

    // ========================================================================
    'traces': {
        ...ClientOnlyRule
    },

    // ========================================================================
    'update-subscriptions': {
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
                message: Message<Payloads.UpdateSubscriptions>
            ) => {
                const syncActor = session.actorSet[message.payload.id];
                if (syncActor) {
                    syncActor.created.message.payload.actor.subscriptions =
                        (syncActor.created.message.payload.actor.subscriptions || []).filter(
                            subscription => message.payload.removes.indexOf(subscription) < 0);
                    syncActor.created.message.payload.actor.subscriptions.push(
                        ...message.payload.adds);
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
                // Associate the client connection with the user id.
                client.userId = message.payload.user.id;

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
    'user-left': {
        ...ClientOnlyRule
    },

    // ========================================================================
    'user-update': {
        ...ClientOnlyRule
    }
};
