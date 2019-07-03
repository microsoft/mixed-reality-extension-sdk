/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor } from "../types/runtime";

/** @hidden */
export default function VisitActor(actor: Actor, callback: (actor: Actor) => void) {
	actor.children.forEach(child => VisitActor(child, callback));
	callback(actor);
}
