/**
 * Names are widened on the way out.
 *
 * Inside `triage.ts` the machine reads best as `begin`, `answer`, `resolve` —
 * the verbs of the thing it models. At the package root those are far too
 * general: `@calma/domain` already exports `next` and `back` for onboarding,
 * and a bare `resolve` in a file that also imports `node:path` is a footgun
 * waiting for someone in a hurry. So the module keeps its verbs and the
 * barrel prefixes them.
 */
export {
  answer as answerTriage,
  begin as beginTriage,
  currentWorryId,
  isResumable,
  openWindow,
  reconcile as reconcileWindow,
  reconsider,
  resolve as resolveTriage,
  summaryShape,
  tally,
  type SummaryShape,
  type TriageOutcome,
  type TriageStage,
  type TriageState,
  type TriageTally,
} from './triage';
