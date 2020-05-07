/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	log,
	newGuid
} from '../../../..';
import {
	Client,
	ClientDesyncPreprocessor,
	ExportedPromise,
	Message,
	MissingRule,
	Payloads,
	Rules,
	SyncActor
} from '../../../../internal';
// break import cycle
import { Protocol, ServerPreprocessing } from '../../../protocols';

/**
 * @hidden
 */
export type SynchronizationStage =
	'always' |
	'load-assets' |
	'create-actors' |
	'active-media-instances' |
	'create-animations' |
	'sync-animations' |
	'set-behaviors' |
	'never';

/**
 * @hidden
 * Synchronizes application state with a client.
 */
export class ClientSync extends Protocol {
	private inProgressStages: SynchronizationStage[] = [];
	private completedStages: SynchronizationStage[] = [];

	// The order of synchronization stages.
	private sequence: SynchronizationStage[] = [
		'load-assets',
		'create-actors',
		'active-media-instances',
		'set-behaviors',
		'create-animations',
		'sync-animations',
	];

	/** @override */
	public get name(): string { return `${this.constructor.name} client ${this.client.id.substr(0, 8)}`; }

	constructor(private client: Client) {
		super(client.conn);
		// Behave like a server-side endpoint (send heartbeats, measure connection quality)
		this.use(new ServerPreprocessing());
		// Queue up user-exclusive messages until the user has joined
		this.use(new ClientDesyncPreprocessor(client));
	}

	/**
	 * @override
	 * Handle the outgoing message according to the synchronization rules specified for this payload.
	 */
	public sendMessage(message: Message, promise?: ExportedPromise, timeoutSeconds?: number) {
		message.id = message.id ?? newGuid();
		const handling = this.handlingForMessage(message);
		switch (handling) {
			case 'allow': {
				super.sendMessage(message, promise, timeoutSeconds);
				break;
			}
			case 'queue': {
				this.client.queueMessage(message, promise, timeoutSeconds);
				break;
			}
			case 'ignore': {
				break;
			}
			case 'error': {
				log.error('network', `[ERROR] ${this.name}: ` +
					`Invalid message for send during synchronization stage: ${message.payload.type}. ` +
					`In progress: ${this.inProgressStages.join(',')}. ` +
					`Complete: ${this.completedStages.join(',')}.`);
			}
		}
	}

	/** @override */
	protected missingPromiseForReplyMessage(message: Message) {
		// Ignore. Sync protocol receives reply messages for create-* messages, but doesn't queue
		// completion promises for them because it doesn't care about when they complete.
	}

	private handlingForMessage(message: Message) {
		const rule = Rules[message.payload.type] || MissingRule;
		let handling = rule.synchronization.before;
		if (this.isStageComplete(rule.synchronization.stage)) {
			handling = rule.synchronization.after;
		} else if (this.isStageInProgress(rule.synchronization.stage)) {
			handling = rule.synchronization.during;
		}
		return handling;
	}

	private isStageComplete(stage: SynchronizationStage) {
		return this.completedStages.includes(stage);
	}

	private isStageInProgress(stage: SynchronizationStage) {
		return this.inProgressStages.includes(stage);
	}

	private beginStage(stage: SynchronizationStage) {
		log.debug('network', `${this.name} - begin stage '${stage}'`);
		this.inProgressStages = [...this.inProgressStages, stage];
	}

	private completeStage(stage: SynchronizationStage) {
		log.debug('network', `${this.name} - complete stage '${stage}'`);
		this.inProgressStages = this.inProgressStages.filter(item => item !== stage);
		this.completedStages = [...this.completedStages, stage];
	}

	private async executeStage(stage: SynchronizationStage) {
		const handler = (this as any)[`stage:${stage}`];
		if (handler) {
			await handler(); // Allow exception to propagate.
		} else {
			log.error('network', `[ERROR] ${this.name}: No handler for stage ${stage}!`);
		}
	}

	/**
	 * @override
	 */
	public async run() {
		try {
			this.startListening();
			this.beginStage('always');
			if (this.client.session.peerAuthoritative) {
				// Run all the synchronization stages.
				for (const stage of this.sequence) {
					this.beginStage(stage);
					await this.executeStage(stage);
					this.completeStage(stage);
					await this.sendQueuedMessages();
				}
			}
			this.completeStage('always');
			// Notify the client we're done synchronizing.
			this.sendPayload({ type: 'sync-complete' } as Payloads.SyncComplete);
			// Send all remaining queued messages.
			await this.sendQueuedMessages();
			this.resolve();
		} catch (e) {
			this.reject(e);
		}
	}

	/**
	 * @hidden
	 * Driver for the `load-assets` synchronization stage.
	 */
	public 'stage:load-assets' = () => {
		// Send all cached asset creation messages.
		for (const creator of this.client.session.assetCreators) {
			this.sendMessage(creator);
		}

		// Send all cached asset-update messages.
		for (const update of this.client.session.assets.map(a => a.update).filter(x => !!x)) {
			this.sendMessage(update);
		}
	};

	/**
	 * @hidden
	 * Driver for the `create-actors` synchronization stage.
	 */
	public 'stage:create-actors' = () => {
		// Sync cached create-actor hierarchies, starting at roots.
		this.client.session.rootActors.map(
			syncActor => this.createActorRecursive(syncActor));
	};

	/**
	 * @hidden
	 * Driver for the `set-behaviors` synchronization stage.
	 */
	public 'stage:set-behaviors' = () => {
		// Send all cached set-behavior messages.
		this.client.session.actors.map(syncActor => this.createActorBehavior(syncActor));
	};

	/**
	 * @hidden
	 * Driver for the `active-media-instances` synchronization stage.
	 */
	public 'stage:active-media-instances' = () => {
		// Send all cached set-behavior messages.
		this.client.session.actors.map(syncActor => this.activeMediaInstances(syncActor));
	};
	/**
	 * @hidden
	 * Driver for the `create-animations` synchronization stage.
	 */
	public 'stage:create-animations' = () => {
		// Send all create-animation calls. The other animation creators were sent in create-actors.
		for (const message of this.client.session.animationCreators) {
			if (message.payload.type === 'create-animation-2') {
				const createMessage = message as Message<Payloads.CreateAnimation2>;
				const updateMessage = this.client.session.animationSet.get(createMessage.payload.animation.id).update;

				// merge lastest state into initial state for create
				super.sendMessage({ ...createMessage,
					payload: { ...createMessage.payload,
						animation: { ...createMessage.payload.animation,
							...updateMessage?.payload.animation
						}
					}
				} as Message<Payloads.CreateAnimation2>);
			}
		}
	};

	/**
	 * @hidden
	 * Driver for the `sync-animations` synchronization stage.
	 */
	public 'stage:sync-animations' = () => {
		// sync new-style animations
		for (const anim of this.client.session.animations) {
			const createMessage = this.client.session.animationCreatorSet.get(anim.creatorMessageId);

			// direct animation updates are merged into the create call, skip here
			if (anim.update && createMessage.payload.type !== 'create-animation-2') {
				super.sendMessage(anim.update);
			}
		}
	}

	private createActorRecursive(actor: Partial<SyncActor>) {
		// Start creating this actor and its creatable children.
		this.createActor(actor); // Allow exception to propagate.
		// const children = this.client.session.childrenOf(actor.created.message.payload.actor.id);
		const children = this.client.session.creatableChildrenOf(actor.initialization.message.payload.actor.id);
		if (children.length) {
			for (const child of children) {
				this.createActorRecursive(child);
			}
		}
	}

	private createActorBehavior(actor: Partial<SyncActor>) {
		if (actor.behavior) {
			super.sendPayload({
				type: 'set-behavior',
				behaviorType: actor.behavior,
				actorId: actor.actorId
			} as Payloads.SetBehavior);
		}
	}

	private createActor(actor: Partial<SyncActor>) {
		if (actor.initialization && actor.initialization.message.payload.type) {
			return this.sendMessage(actor.initialization.message);
		}
	}

	private activeMediaInstances(actor: Partial<SyncActor>) {
		(actor.activeMediaInstances || [])
			.map(activeMediaInstance => {
				// TODO This sound tweaking should ideally be done on the client, because then it can consider the
				// time it takes for packet to arrive. This is needed for optimal timing .
				const targetTime = Date.now() / 1000.0;
				if (activeMediaInstance.expirationTime !== undefined &&
					targetTime > activeMediaInstance.expirationTime) {
					// non-looping mediainstance has completed, so ignore it
					return undefined;
				}
				if (activeMediaInstance.message.payload.options.paused !== true) {
					let timeOffset = (targetTime - activeMediaInstance.basisTime);
					if (activeMediaInstance.message.payload.options.pitch !== undefined) {
						timeOffset *= Math.pow(2.0, (activeMediaInstance.message.payload.options.pitch / 12.0));
					}
					if (activeMediaInstance.message.payload.options.time === undefined) {
						activeMediaInstance.message.payload.options.time = 0.0;
					}
					activeMediaInstance.message.payload.options.time += timeOffset;
					activeMediaInstance.basisTime = targetTime;
				}
				return this.sendMessage(activeMediaInstance.message);
			});
	}

	public async sendQueuedMessages() {
		// 1. Get the subset of queued messages that can be sent now.
		// 2. Send the messages and wait for expected replies.
		// 3. Repeat until no more messages to send.
		do {
			const queuedMessages = this.client.filterQueuedMessages((queuedMessage) => {
				const message = queuedMessage.message;
				const handling = this.handlingForMessage(message);
				return handling === 'allow';
			});
			if (!queuedMessages.length) {
				break;
			}
			for (const queuedMessage of queuedMessages) {
				this.sendMessage(queuedMessage.message, queuedMessage.promise, queuedMessage.timeoutSeconds);
			}
			await this.drainPromises();
		} while (true); // eslint-disable-line no-constant-condition
	}
}
