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
	Color3Like,
	Color4Like,
	LightLike,
	LookAtLike,
	MaterialLike,
	MeshLike,
	PrefabLike,
	QuaternionLike,
	ScaledTransformLike,
	SoundLike,
	TextLike,
	TextureLike,
	TransformLike,
	UserLike,
	Vector2Like,
	Vector3Like,
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
	T extends Color4Like ? Color4Like :
	T extends Color3Like ? Color3Like :
	T extends LightLike ? LightLike :
	T extends LookAtLike ? LookAtLike :
	T extends MaterialLike ? MaterialLike :
	T extends MeshLike ? MeshLike :
	T extends PrefabLike ? PrefabLike :
	T extends QuaternionLike ? QuaternionLike :
	T extends ScaledTransformLike ? ScaledTransformLike :
	T extends SoundLike ? SoundLike :
	T extends TextLike ? TextLike :
	T extends TextureLike ? TextureLike :
	T extends TransformLike ? TransformLike :
	T extends UserLike ? UserLike :
	T extends Vector3Like ? Vector3Like :
	T extends Vector2Like ? Vector2Like :
	T extends VideoStreamLike ? VideoStreamLike :
	never;
