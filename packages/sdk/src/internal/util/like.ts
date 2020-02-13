/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
	ActorLike,
	ActorTransformLike,
	AnimationLike,
	AnimationDataLike,
	AppearanceLike,
	AssetLike,
	AttachmentLike,
	ColliderLike,
	LightLike,
	LookAtLike,
	MaterialLike,
	MeshLike,
	PrefabLike,
	ScaledTransformLike,
	SoundLike,
	TextLike,
	TextureLike,
	TransformLike,
	UserLike,
	VideoStreamLike
} from '../..';

export type Like<T> =
	T extends ActorLike ? ActorLike :
	T extends ActorTransformLike ? ActorTransformLike :
	T extends AnimationLike ? AnimationLike :
	T extends AnimationDataLike ? AnimationDataLike :
	T extends AppearanceLike ? AppearanceLike :
	T extends AssetLike ? AssetLike :
	T extends AttachmentLike ? AttachmentLike :
	T extends ColliderLike ? ColliderLike :
	T extends LightLike ? LightLike :
	T extends LookAtLike ? LookAtLike :
	T extends MaterialLike ? MaterialLike :
	T extends MeshLike ? MeshLike :
	T extends PrefabLike ? PrefabLike :
	T extends ScaledTransformLike ? ScaledTransformLike :
	T extends SoundLike ? SoundLike :
	T extends TextLike ? TextLike :
	T extends TextureLike ? TextureLike :
	T extends TransformLike ? TransformLike :
	T extends UserLike ? UserLike :
	T extends VideoStreamLike ? VideoStreamLike :
	unknown;
