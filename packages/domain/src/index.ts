/**
 * @calma/domain — pure, dependency-free logic.
 *
 * Everything Calma knows how to *reason* about lives here: entities and their
 * schemas, tier rules, breathing pattern maths, day and week keys.
 *
 * The package's only dependency is zod. It must never import React, React
 * Native, MMKV, or anything else platform-bound — that is what makes all of
 * this testable in Node with no simulator. The boundary is enforced by lint
 * (plans/01-foundation.md#T08), not by good intentions.
 *
 * See systems/01-architecture.md § Package boundaries.
 */

export * from './entities';
export * from './breathing';
export * from './breathing.machine';
export * from './id';
export * from './streak';
export * from './tier';
export * from './time';
