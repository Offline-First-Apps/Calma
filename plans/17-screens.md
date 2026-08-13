# 17 — Screens: Function & Feeling

**This is a design brief, not a todo list.** It is written for whoever designs Calma.

It deliberately says nothing about layout, hierarchy, placement, sizing, or component structure. Those are yours. What it gives you instead is, for every screen and view: what it does, who is arriving and in what state, what they should feel on the way out, which part of the palette it lives in, and the specific traps that would break it.

Read `systems/07-copy-and-tone.md` alongside this. The tone rules are not decoration — they are the product.

---

## The person you are designing for

Not a wellness enthusiast. Not someone optimising their morning routine.

Someone whose chest is tight at 2am. Someone whose mind has been circling the same thought for forty minutes. Someone who opened this app because they didn't know what else to do with their hands.

They are not reading. They are scanning, and barely. Their working memory is compromised — anxiety does that. They may be shaking. They may be crying. They may have opened the app and then forgotten why.

**Design for the worst moment, not the average one.** A screen that works when someone is calm but overwhelms them when they're panicking is a failed screen, even if it tests beautifully.

### The five feelings, in priority order

1. **Safe** — nothing here will judge, surprise, or demand.
2. **Held** — someone thought about this moment before I got here.
3. **Unhurried** — there is no clock on me.
4. **Capable** — I can do the thing in front of me.
5. **Private** — this is mine and nobody else's.

Where two conflict, the lower number wins.

### The palette, in one paragraph

Warm neutrals. Cream and sand backgrounds in daylight, deep navy at night. Amber is the warmth — the orb, the primary action, the thing that glows. Clay is for worry: earthier, a little heavier, the colour of something you're holding. Sage appears rarely and quietly, only for things that went well. There is no red in this app. There is no pure white and no pure black. Nothing is neon, nothing is clinical, nothing is the blue of a hospital login screen. Full token values are in `systems/03-design-system.md`.

### Things that are true on every screen

- **Nothing flashes, strobes, or pulses fast.** Nothing moves quickly. Motion is breath-paced.
- **No red, no warning icons, no alert triangles.** Nothing in Calma is an error.
- **No badges, no counts on tab icons, no unread indicators.** A red dot is an obligation, and obligations are what this app is for escaping.
- **No progress bars, no percentages, no completion rings.** Nothing is being measured.
- **No exclamation marks and no emoji** — with a single exception, the three feeling faces.
- **Empty space is not a problem to solve.** Room to breathe is the whole metaphor.
- Every screen must survive a 200% font scale and full dark mode without becoming a different design.
- **Every screen must survive ~40% longer text.** English ships alone, but the app is built to be translated (`systems/10-i18n.md`) and German and Finnish run long. Nothing may depend on a string being short. Nothing truncates — ever, on user content.
- **Nothing in the app speaks.** There is no voice track and no narration anywhere (D-012). Warmth comes from copy, motion, sound, and haptics.

---

# A. Before anything

## A1 — Splash

**Function.** Holds the frame while fonts load, storage decrypts, migrations run, and stores hydrate.

**Arriving.** Possibly mid-panic, having tapped the icon with urgency. Every millisecond here is felt.

**Leaving.** Should not register as a screen at all. The person should feel they arrived instantly.

**Palette.** Sand in light, deep navy in dark — matched exactly to whatever screen comes next, so the handoff is invisible. Never a white flash. A white flash at 2am is physically painful and is the first thing this app would be judged on.

**Feels like.** A room that was already warm when you walked in. Not a door opening — a curtain lifting.

**Never.** A logo animation. A spinner. A loading percentage. A tagline. Branding is not what someone needs in the first 400ms of a panic attack.

---

## A2 — Degraded boot

**Function.** Shown in the rare case where encrypted storage cannot be opened. The app runs, but cannot read or write records. The panic button still works — that is the point of this screen existing at all.

**Arriving.** Confused. Possibly frightened that their private writing is gone.

**Leaving.** Reassured that nothing is lost, and clear that they can still breathe.

**Palette.** Identical to Home. This must not look like an error state, because it isn't one from the user's side — it's a temporary limitation.

**Feels like.** A friend saying "the kettle's broken but I've still got you" — not a system dialog.

**Never.** A stack trace, an error code, the word "failed", a red anything, a sad face. Never imply data has been lost unless it certainly has.

---

# B. First contact — onboarding

Eleven steps, roughly two minutes, no voice track. Full rationale in `systems/11-onboarding.md`.

Three things govern this whole section:

**There is no signup.** No account, no email, no social login, nothing to create. Most onboarding design instinct assumes a signup somewhere — here there isn't one, and the absence is a feature the person should feel.

**There is no paywall.** No price, no plan, no "Plus", no user count, no testimonial. Nothing is sold before the app has proved useful (D-013).

**There is always a way out.** A plainly-worded escape sits on every step and goes straight to breathing. Some people download this app *during* the thing it's for, and they must not meet a quiz (D-014).

**One deliberate exception to the app-wide rules:** onboarding may show quiet progress indication. Elsewhere a progress bar turns rest into a task; here, not knowing how much is left is its own low-grade anxiety. It should be a sense of position — never a percentage, never "4 of 12".

---

## B1 — Welcome

**Function.** The first frame. Establishes what the app is by showing it rather than describing it.

**Arriving.** Curious, tired, a little sceptical. They have downloaded mental-health apps before and deleted them. They are deciding, right now, whether to trust this one.

**Leaving.** Wanting to see the next screen.

**Palette.** The orb's amber against a nearly empty ground. This is the app's moment of pure atmosphere — spend the visual budget here.

**Feels like.** The orb is already breathing when the screen appears. Not animating *in* — already going, as though it had been doing this before they arrived. One line of copy. Someone sitting down next to you rather than standing in front of you.

**Never.** A feature list, a carousel, dot pagination, a value proposition, a "Get started" button that competes with the orb for attention. Never explain what the orb is — the person will work it out in three seconds, and letting them is the whole point.

---

## B2 — Language

**Function.** Confirms the detected device language and lets it be corrected. Pre-selected, never blank.

**Arriving.** Expecting the app to have got this right, and mildly irritated if it hasn't.

**Leaving.** Confident they'll be able to read everything, and aware they can change it later.

**Palette.** Plain, quiet, sand. This is a utility step and should look like one.

**Feels like.** A checked box, not a question. The detected language is already chosen; the person is confirming, not deciding. Each language appears **in its own language** — someone looking for Português is not reading English to find it.

**Never.** Present an unselected list. Show flags — flags are countries, not languages, and getting that wrong is a way to annoy people from several continents at once. Block progress. And when only one language is supported, don't ask a question with one answer: acknowledge and move on.

---

## B3 — Founder note *(CUT — D-019)*

**Removed from the flow.** The handwritten founder note is not built. Designs
exist at `designs/extracted/b3-founder-note-{light,dark}.html` for reference
only — do not implement them.

**Why.** It required real scanned handwriting in the founder's own words. A
handwriting font would be detectable and worse than not trying, and a note that
reads as a growth tactic actively damages trust rather than building it. Better
cut than faked.

**Where its job went.** It was carrying the warmth the removed voice track used
to carry. That now falls on **B7 (first breath)** and on the copy throughout —
someone feeling the app work on their body is more persuasive than a note about
why it was built.

**Screen IDs are not renumbered.** B4–B11 keep their IDs so every reference into
`designs/extracted/` stays valid.

---

## B4–B6 — The three questions

**Function.** Three multi-select questions in sequence: what brings you here, when is it hardest, what's helped before. Every answer changes something real.

**Arriving.** Willing to answer, but wary of being profiled. Aware that most apps ask questions and then ignore the answers.

**Leaving.** Feeling the app knows one or two true things about them.

**Palette.** Sand, with amber marking selection. Options must be visually equal — no option is the "right" one, none is more concerning than another.

**Feels like.** Being asked by a person, not filling in an intake form. One question per screen, conversational phrasing, and **multi-select throughout** — anxiety rarely has one cause, and forcing a single choice makes the app feel like it isn't listening. Selecting nothing is a valid answer and must not feel like one.

**Never.** Clinical vocabulary, severity scales, diagnostic framing, or anything resembling a screening instrument. Never require an answer. Never show how many questions remain as a number. Never make an option sound like an admission.

---

## B7 — First breath *(the aha moment)*

**Function.** Three real cycles of the physiological sigh, with haptics. Not a demo — a real session, recorded.

**Arriving.** Has been answering questions and is ready to see whether any of this works.

**Leaving.** Having felt the app do something to their body. **This is the moment the product either lands or doesn't.**

**Palette.** The session palette. The world narrows to the orb exactly as it will in the real thing, because this *is* the real thing.

**Feels like.** The pulse in the hand is the payload. Everything before this screen was setup; everything after is admin. The whole product is legible in about eight seconds — *something else is keeping the time, I can stop holding it*.

The launch affordance sits where the panic button will live and looks like it will look. The person learns the gesture by performing it, at the moment it first pays off. That is the entire panic-button tutorial, and it needs no arrow, no tooltip, no coach mark.

**Never.** A preview, a simulation, or a "demo" label. A countdown. An explanation of the physiology — nobody needs to hear about the parasympathetic nervous system right now. Never trap them: this is skippable like everything else.

---

## B8 — How was that

**Function.** One tap: better, same, worse.

**Arriving.** Just surfaced from the first genuinely calm eight seconds.

**Leaving.** Heard.

**Palette.** Sand returning gently. Three equal options.

**Feels like.** A person glancing over. "Worse" must be as visually comfortable as "better" — and met with warmth, not concern. Someone who felt worse after their first try is exactly who most needs the next screen to be gentle.

**Never.** Treat "worse" as a problem to escalate. Score it. React with an offer, a tip, or a resource. Congratulate "better".

---

## B9 — Here's your Calma

**Function.** States plainly what their answers changed. The payoff for the questions.

**Arriving.** Having given three answers and wondering whether it mattered.

**Leaving.** With a Calma that is slightly theirs, and knowing exactly how.

**Palette.** The warmest screen in onboarding. Sand and amber, settled, unhurried.

**Feels like.** Someone setting the table for you. Specific, not generic — *"your worry window is set for 8pm"* rather than *"we've personalised your experience"*. Specificity is the entire difference between personalisation and the appearance of it. This is also where the panic button gets named in one sentence, now that they've already used it.

**Never.** Claim an outcome. No "you're 3x more likely to feel better" — that's a clinical claim, and it's unfalsifiable and unearned. Never present this as a completed profile or a plan. And when someone skipped every question, be honest about it rather than fabricating a personalised-looking screen from nothing.

---

## B10 — Notifications

**Function.** Shows what a Calma notification actually looks like, then asks. The OS dialog only follows an explicit yes.

**Arriving.** Reflexively suspicious. Most apps have burned them on this.

**Leaving.** Having made an informed choice either way.

**Palette.** Sand, plain. The notification preview should look convincingly like a real one.

**Feels like.** Being shown the thing before being asked about the thing. Seeing the actual message — *"Your worry window opens soon. You have 2 things waiting."* — does more than any explanation. And the honesty of "that's the only thing we'll send" is checkable, which is why it's worth saying.

**Never.** Trigger the native dialog without this screen first — a declined system permission is spent, and re-earning it means sending the person into Settings. Never imply the app is worse without it. Never ask again later.

---

## B11 — Name

**Function.** Optionally captures a first name, stored only on device.

**Arriving.** Slightly guarded. This is the first thing the app asks *for*, after everything so far has promised privacy.

**Leaving.** Certain that skipping cost them nothing.

**Palette.** Sand, quiet, low-contrast. A small moment that should look like one.

**Feels like.** Being asked, not being enrolled. The on-device hint sits right there, because this is the exact moment someone wonders where the name goes.

**Never.** A required field. A "we'll personalise your experience" pitch. Any implication that the app is worse without it. The skip must be as visually present as the confirm.

---

## B12 — Crisis escape *(persistent, every step)*

**Function.** Leaves onboarding immediately for a panic session. Present on every screen in this section.

**Arriving.** In distress, having downloaded the app *because* they're in distress, and now facing a quiz.

**Leaving.** Breathing, within a second.

**Palette.** Warm and legible without competing with the step's own content. It should be findable the moment it's needed and unobtrusive the rest of the time.

**Feels like.** A door left open. Its wording has to be recognisable in about half a second of degraded reading — plain, direct, no cleverness. Most people will never use it; its presence is what makes the rest of onboarding safe to be long.

**Never.** Hidden behind a menu, faded, delayed, or below the fold. Never require confirmation. Never framed as quitting, skipping, or missing out. Never absent from a single step, including the ones that seem harmless.

---

# C. Home

## C1 — Home

**Function.** The landing surface. Offers an immediate sigh, a route into breathing, and a neutral statement of anything waiting in the worry queue.

**Arriving.** In one of two completely different states — either *acutely distressed and looking for the fastest way out*, or *calm and checking in*. The screen must serve the first without boring the second.

**Leaving.** Oriented. Aware of one obvious thing they could do next, and under no pressure to do it.

**Palette.** The warmest, softest surface in the app. Cream and sand, amber only where something is offered. This is the room, not the tool.

**Feels like.** Coming home to a quiet flat. Not a dashboard, not a feed, not a control panel. There is a difference between *"here's everything you could do"* and *"here's where you are"* — this is the second.

**One obvious next thing.** With five tabs now, Home must get quieter rather than busier. A well-liked competitor's own 4★ review opens by calling its home screen overwhelming — *"you're greeted with a lot of choices"*. Home offers one clear action, sized and placed accordingly; everything else is present but recessive. A first visit after onboarding shows less, not more.

**Never.** Statistics on arrival. A streak number as the first thing seen — that turns showing up into a performance. Suggestions, tips, quotes of the day. A greeting that assumes cheerfulness ("Good morning" to someone at 3am is a small cruelty; the greeting should be time-honest or absent). And never a zero of any kind: when there's nothing to report, report nothing.

---

# D. Breathing

## D1 — Pattern picker

**Function.** Chooses between 4-7-8, 5-5-5-5, the physiological sigh, and (for Plus) a custom rhythm.

**Arriving.** Wanting to breathe, unsure which one. Probably does not know what "4-7-8" means and should not have to.

**Leaving.** Having chosen without deliberating. Choice paralysis is an anxiety symptom — this screen must not induce it.

**Palette.** Sand ground, each pattern carrying a touch of amber. The patterns should feel like siblings, not like tiers or a difficulty ladder.

**Feels like.** Choosing a mug. Low stakes, quick, no wrong answer.

**Never.** Clinical names alone — each needs a plain-language line about what it's *for* ("for winding down", "for right now"). Never rank them, never mark one "recommended", never show duration as a commitment. Never gate the visual appearance of the custom option behind a lock icon — see F-notes on paywalls.

---

## D2 — Pre-session intensity

**Function.** A 0–10 rating of how the person feels right now, captured before non-panic sessions. Skippable. Feeds the journaling trigger and long-term trends.

**Arriving.** Feeling something they may not have words for. Being asked to quantify distress can itself be distressing.

**Leaving.** Having answered in under three seconds, or having skipped without friction.

**Palette.** The scale should read as a warm gradient, not a severity scale. Amber to clay, not green to red. Higher is not "bad" — it is just *more*.

**Feels like.** Pointing at where it hurts, not filling in a form.

**Never.** Numbers as the primary visual. Clinical anchor words. A red end of the scale. Any implication that a high number is a failure or a low number is a success. And never on the panic path — someone in crisis is not being asked to self-assess.

---

## D3 — Breathing session

**Function.** The core of the app. An orb expands and contracts with the breath, a haptic marks each transition, a single word names the phase. Nothing else exists on this screen.

**Arriving.** Anywhere from mildly tense to barely holding it together.

**Leaving.** A measurable degree calmer, and — more importantly — feeling that something took care of the timing so they didn't have to.

**Palette.** This is amber's screen. A warm gradient body with soft, blurred, indistinct edges, glowing against a receding ground. In dark mode the amber drops in intensity so it never sears a dark-adapted eye. The background should almost disappear.

**Feels like.** Watching a fire settle. Or a jellyfish. Something alive and unhurried that is not aware of you. The orb should never feel mechanical, never feel like a loading indicator, never feel like it is *measuring* the breath — it is *keeping company with* it. It is never perfectly still, even during a hold; a completely static orb reads as frozen, and frozen reads as broken.

**Never.** A countdown. A timer. A cycle counter. A progress ring. Anything numeric at all — counting down is a stress cue and undoes the work the screen is doing. Never any chrome, no back arrow competing for attention, no tab bar. Never a hard-edged circle: soft, blurred, gradient edges are the entire difference between "alive" and "a div". And nothing on this screen may move faster than a breath.

---

## D4 — Stop confirmation

**Function.** Catches an accidental exit mid-session.

**Arriving.** Either finished early on purpose, or swiped by mistake.

**Leaving.** Out, or back in, in one tap either way.

**Palette.** The session's own palette, barely disturbed. This should feel like a pause in the room, not a new room.

**Feels like.** Someone glancing up and asking "you good?" — not a modal dialog.

**Never.** "Are you sure?" — that phrasing makes leaving feel like a mistake. Never make stopping the harder path or the smaller target. Never guilt: no "you're almost there", no progress lost, no incomplete session language.

---

## D5 — Extension offer

**Function.** At the natural end of a session, asks once whether to continue.

**Arriving.** Settled, possibly quite deep in it, possibly wanting more.

**Leaving.** Either continuing seamlessly, or done and unbothered.

**Palette.** Unchanged from the session. The orb should still be there, still breathing, while this is asked.

**Feels like.** A held door. Open, no push.

**Never.** Auto-continue. Auto-stop without asking. Never ask twice. Never suggest a "recommended" length.

---

## D6 — Post-session feeling check

**Function.** Three faces — better, same, worse. Optional. Determines whether the journaling offer appears.

**Arriving.** Just surfaced from a few minutes of focus. Slow, a bit dazed.

**Leaving.** Acknowledged. Whichever they picked.

**Palette.** Sand returning gently. The singing bowl plays here; the visual should have the same quality of decay — something settling rather than something appearing.

**Feels like.** Being asked how it went by someone who will accept any answer. The three options must be visually equal — no green tick on "better", no grey on "worse". The person who taps "worse" is the one who most needs this screen not to flinch.

**Never.** Congratulate. Celebrate. Show what they picked last time. Compare to previous sessions. Score anything.

---

## D7 — Custom rhythm builder *(Plus)*

**Function.** Sets a personal inhale / hold / exhale / rest ratio.

**Arriving.** Someone who knows what they're doing and wants their own numbers.

**Leaving.** With a rhythm that's theirs.

**Palette.** Sand and amber, marginally more "instrument" than the rest of the app — this is the one screen where a person is deliberately adjusting something.

**Feels like.** Tuning, not configuring. Ideally the orb previews the rhythm live, so the person feels the setting rather than reading it.

**Never.** Accessible mid-session. Never presented as the "advanced" or "correct" option — the presets are not training wheels.

---

# E. Panic

## E1 — Panic button *(persistent, floating)*

**Function.** One tap, from anywhere, into a 60-second physiological sigh. No questions. Always free.

**Arriving.** The worst state the app will ever encounter. Possibly hyperventilating. Possibly unable to read.

**Leaving.** Into breathing, in under a second.

**Palette.** Amber, the warmest and most saturated in the app. It should be the single most findable object on any screen — and it must be findable *peripherally*, without searching, by someone whose vision has tunnelled.

**Feels like.** A hand held out. It should have a barely perceptible life to it at rest — a slow ambient breath of its own — so that it reads as *waiting for you* rather than as a button. It must never feel like an emergency control. No red, no siren language, no alarm iconography. The word "panic" appears in our documentation, not on the button.

**Never.** A confirmation. A long-press. A label that requires reading. A position that shifts between screens. Anything overlapping it. And never — under any circumstances — anything between this tap and the orb: no permission prompt, no paywall, no rating request, no update notice, no intensity slider.

---

## E2 — Panic session

**Function.** A 60-second double-inhale sigh cycle. A deep wooden drum on entry, then near-silence. One reassuring line, then just the orb.

**Arriving.** In crisis.

**Leaving.** Not necessarily fine. Just: through the next minute.

**Palette.** The darkest, quietest version of the breathing screen, in both themes. The world narrows to the orb. Everything else recedes almost entirely.

**Feels like.** The drum on entry is the emotional centre of the whole product — a low, round, physical *thud* that lands in the chest and says *I've got you, we're doing this now*. Whatever the screen does visually at that instant should match that weight: a settling, an arrival, something taking hold. Then stillness.

**Never.** Anything at all beyond the orb, one line of text, and a way out. No timer, no "you're doing great", no breathing instructions in text form, no options.

---

## E3 — Panic exit

**Function.** An always-visible way out, at any moment, with no cost.

**Arriving.** Might be calmer. Might be worse. Might just need to answer the phone.

**Leaving.** Out, immediately, no questions.

**Palette.** Quiet. Present but not competing with the orb.

**Feels like.** An unlocked door you can see from anywhere in the room. Its visibility is what makes the room safe — most people will never use it, and that's the point.

**Never.** Hidden, faded out, delayed, or requiring confirmation. Never phrased as quitting or failing.

---

## E4 — Panic ending

**Function.** Closes the 60 seconds with the singing bowl and one line. Offers more time or the way home.

**Arriving.** Steadier, or not. Either is normal.

**Leaving.** Not evaluated. Not asked to rate anything. Just — still here.

**Palette.** The warmest moment in the app. Sand returning like light coming back up in a room, slowly.

**Feels like.** Someone quietly acknowledging that you got through it. "You're still here. That's enough." should be the emotional peak of the entire product, and it should be almost nothing visually.

**Never.** A feeling check. A journaling offer. A paywall. A streak update. A stat. Anything transactional. This path stays sacred — nothing is ever sold, measured, or asked here.

---

# F. Worry

## F1 — Worries tab

**Function.** Captures worries frictionlessly, states how many are waiting, and shows when the window opens.

**Arriving.** Mid-spiral. A thought is circling and they want it out of their head.

**Leaving.** Lighter by exactly one thought.

**Palette.** Where clay lives. Earthier and slightly heavier than Home — appropriate for the room where things are being set down. Still warm, never gloomy.

**Feels like.** A shelf. Or a bowl by the door where you drop your keys. Somewhere trustworthy to *put something down*, with the clear implication that you'll pick it up later — not a bin, not an archive, not a to-do list.

**Never.** Show the worries. This is the load-bearing rule of the entire feature: the pending state is a **count only**, never a preview, never a list, never a first line. Showing them back defeats the postponement. Never use a red badge, never let the count feel like a debt, never sort or prioritise them, never let the number be the largest thing on screen.

---

## F2 — Capture

**Function.** A field that takes a worry and immediately makes it disappear.

**Arriving.** Urgent. Needing it out *now*, before the thought is lost or before they lose their nerve.

**Leaving.** Relieved of it, and certain it was received.

**Palette.** Clay-tinted, soft. Whatever holds the text should feel temporary — like a note, not a record.

**Feels like.** Writing on a slip of paper and folding it. Ready the instant the tab opens, no tap required to begin. And when submitted, the text should *go* — a dissolve upward, a pebble dropping into water, gone. The person should feel the transfer of weight.

**Never.** Ask for a category, a tag, a severity, a title, or a due date. Never validate or require a minimum length. Never echo the text back in a confirmation. Never make them scroll past their own previous worries to write a new one.

---

## F3 — Capture confirmation

**Function.** Confirms receipt and names the time it'll be returned to.

**Arriving.** Having just let go of something.

**Leaving.** Trusting that it's held.

**Palette.** Clay softening back into sand. The pebble sound and a light haptic land here together.

**Feels like.** A ripple settling on still water. Brief — a second or so — and then the field is clean and ready again, because the next worry is often three seconds behind the first.

**Never.** Persist as a banner or toast that must be dismissed. Never repeat the worry text. Never say "saved" or "added" — this is not a record being filed, it's a thing being held.

---

## F4 — Window intro

**Function.** Opens the worry window. Reintroduces the queue with a change of stance.

**Arriving.** Braced. They know what's in there and they have been dreading it slightly.

**Leaving.** Willing to look.

**Palette.** Clay warming toward amber — a deliberate shift from *holding* to *working through*. The lighting metaphor is sitting down at a table with a lamp on.

**Feels like.** Rolling your sleeves up gently. "You saved this earlier. Let's look at it with fresh eyes." The word *let's* is doing the work — this is accompanied, not assigned.

**Never.** Show the total as a challenge. Never use "process", "clear", "tackle", "get through" — this is not a queue being drained. Never show a progress indicator. Never allow new worries to be added here; the window is for looking, not gathering.

---

## F5 — Triage question

**Function.** Shows one worry, in full, and asks whether anything can be done about it.

**Arriving.** Facing the thing directly, possibly for the first time since capturing it.

**Leaving.** Having made one small, clear decision.

**Palette.** The worry's own text is the focus. Clay ground. Both answers must be identically weighted — this is a fork, not a recommendation.

**Feels like.** Turning one object over in your hands. Only one worry exists on this screen; the others must not be visible, countable, or implied. Anxiety multiplies when the pile is visible.

**Never.** Make "Yes" the primary and "Not really" the secondary. Never style one as positive and the other as negative — releasing is not giving up, and actioning is not winning. Never offer "skip" as an equal third option that makes avoidance frictionless. Never show how many remain.

---

## F6 — Action step

**Function.** Captures one small next step for a worry that can be acted on.

**Arriving.** Slightly energised — this one is theirs to move.

**Leaving.** Holding a plan instead of a fear.

**Palette.** Clay lifting toward amber and, very quietly, sage. Something turned useful.

**Feels like.** Writing on a Post-it. "Doesn't have to be big" must be *visible*, not buried — the whole failure mode of this step is someone freezing because they can't think of a good enough answer. An empty answer must be accepted and must not feel like a failure.

**Never.** Require the field. Suggest examples that set a bar. Ask for a deadline, a reminder, or a calendar entry. Turn this into a task manager — the moment this becomes a to-do list, the app has become the thing it exists to relieve.

---

## F7 — Release step

**Function.** Lets go of a worry that can't be acted on. A deliberate physical gesture. Permanent.

**Arriving.** Holding something heavy and being told they're allowed to stop.

**Leaving.** Genuinely, physically lighter. This is the emotional high point of the worry feature and possibly of the app.

**Palette.** Clay dispersing. Whatever the animation does, it should end in the ground colour — the worry doesn't go *somewhere*, it stops being a thing.

**Feels like.** Opening your hand. The gesture must be deliberate — a swipe, a real movement, something the body does — because releasing by tapping a button would feel administrative. Dry leaves scattering on a gust. The animation should be the most beautiful moment in the app; it is the reward for the hardest thing the person does here.

**Never.** An undo. A confirmation dialog. An archive. A "released items" list. The honesty of "this is gone" is what makes it work — anything reversible turns a release into a filing action. Never make the gesture so easy it happens by accident, and never so hard it becomes frustrating. Never call it deleting.

---

## F8 — Window summary

**Function.** Reflects on what just happened. How many were actionable, how many were let go.

**Arriving.** Spent. Something real just happened.

**Leaving.** With perspective — *most of what I was carrying wasn't mine to carry* is often the realisation, and this screen exists to let it land.

**Palette.** The warmest end-state in the app after the panic ending. Sand and amber, with sage present but restrained.

**Feels like.** Sitting back. It ends on a question — "How does that feel?" — that is not a form field and does not need answering. It's a pause, not an input.

**Never.** Score, grade, or compare to previous windows. Never celebrate. Never suggest they should have done more, or done it differently. Never show a chart. And never use the mixed-outcome phrasing when everything went one way — an all-released window and an all-actioned window each need their own honest sentence.

---

# G. Journal

## G0 — Write tab

**Function.** The home of writing. Start a new entry, resume a draft, read past entries. A first-class destination, not a consolation prize after a bad breathing session (D-015).

**Arriving.** In one of three different moods: *I need to get something out of my head right now*, *I left something half-finished*, or *I want to read what I wrote before*. The first is the most urgent and the most common.

**Leaving.** Writing, within one tap.

**Palette.** Paper. The most page-like surface in the app — sand and cream, the writing itself the darkest thing present. Continuous with the editor it leads into, so entering a new entry feels like turning a page rather than opening a different app.

**Feels like.** An open notebook on a table. Starting to write must be the fastest thing on this screen — a competitor's own users asked for *"a quicker way to create journal entries without having to wade through the other elements"*, and that request is the reason this tab exists. Reading back and resuming drafts are both real needs, but neither may stand between someone and a blank page.

**Never.** Lead with the archive. Present the three modes as equals — writing now outranks the other two. Show a count of entries, a weekly quota, or anything resembling a target. Nag about unfinished drafts. And never analyse or summarise what's been written — no word clouds, no themes, no "you've mentioned work a lot this month" (D-016 rationale in `plans/19-review-findings.md` R9).

---

## G1 — Journaling offer

**Function.** After a high-distress session, offers writing as a next step. Once. Dismissible.

**Arriving.** Just breathed, still not okay.

**Leaving.** Either writing, or gone with no residue.

**Palette.** Sand. Extremely quiet. This is an offer, and offers should be smaller than invitations.

**Feels like.** Someone sliding a notebook across a table without saying anything. "Not right now" must be a completely clean exit.

**Never.** Appear after the panic session. Appear twice for the same session. Persist, nag, or re-offer later. Frame writing as what they *should* do.

---

## G2 — Entry editor

**Function.** Walks through a cognitive-restructuring template: what happened, what you thought, what you felt and how strongly, what supports the thought, what doesn't, and what you'd tell a friend.

**Arriving.** Distressed and being asked to think clearly — a genuinely hard ask. This is the most cognitively demanding screen in the app by a wide margin.

**Leaving.** Having untangled something, or at least having got it out of their head and onto a surface.

**Palette.** The most paper-like surface in the app. Sand and cream, minimal ornament, the writing itself the darkest thing on screen. This should feel like a page, not a form.

**Feels like.** A notebook, not a questionnaire. Every question must feel askable by a person — this is why the last step is "if a friend said this to you, what would you tell them?" rather than "identify a balanced alternative thought". One thing at a time, no sense of a long form ahead. **Every field must be skippable**, because a required field to someone in distress is a wall.

**Never.** Show a step counter or "3 of 6" — that turns support into homework. Never validate, never require, never mention cognitive distortions or any clinical framework by name. Never analyse what they wrote back at them. Never lose text: this is the one screen where a data loss would be a genuine betrayal.

---

## G3 — Re-rating

**Function.** Asks for emotional intensity again, after writing.

**Arriving.** Having just done real work.

**Leaving.** Aware of any shift, without being told what it means.

**Palette.** Same as the editor, closing down. Nothing new introduced.

**Feels like.** Checking the temperature. The delta is shown, plainly, and nothing is said about it. **No change and an increase are entirely normal outcomes** — sometimes writing surfaces things — and the screen must be completely unbothered by either. This is where a lesser app would say "great progress!" and lose the user's trust permanently.

**Never.** Celebrate a drop. Mark a rise as concerning. Show a green arrow or a red one. Compare to previous entries. Suggest they write more if it didn't improve.

---

## G4 — Save confirmation

**Function.** Confirms the entry is stored and private.

**Arriving.** Finished, slightly drained.

**Leaving.** Done. Free to close the app.

**Palette.** Warm, closing, brief. Pencil on paper and a palm pressing flat.

**Feels like.** Closing a notebook. "Saved. That's yours." The possessive matters — it is the privacy promise delivered at exactly the moment it counts most.

**Never.** A summary. An analysis. A word count. A suggestion to write again tomorrow. A share option — there is nothing to share this with, and even offering would break the premise.

---

## G5 — Drafts

**Function.** Lists unfinished entries so they can be resumed.

**Arriving.** Returning to something they walked away from, possibly days ago.

**Leaving.** Either back in it, or having discarded it cleanly.

**Palette.** Sand, slightly lower contrast than saved entries — visibly *in progress* without looking broken or erroneous.

**Feels like.** A bookmark. Something waiting patiently. Not an unfinished task.

**Never.** Nag. Badge. Expire. Count. Never use "incomplete" or "unfinished" — the word is "draft", and drafts are allowed to stay drafts forever.

---

## G6 — Entry list

**Function.** Past entries, grouped by day.

**Arriving.** Looking back, usually calm, sometimes looking for a specific hard day.

**Leaving.** With a sense of continuity. *I've been through this before and came out.*

**Palette.** Sand, restful, low-contrast. This is a quiet archive, not a feed.

**Feels like.** Leafing back through a notebook. Days should feel like days — dated, human ("Tuesday evening"), not timestamped.

**Never.** Surface a "memory" or "on this day" unprompted. Never highlight the worst entries. Never visualise emotional intensity as colour in the list — turning someone's bad week into a heat map is a small horror.

---

## G7 — Search *(Plus)*

**Function.** Finds entries by text.

**Arriving.** Looking for something specific — often "have I felt this before?"

**Leaving.** Having found it, or knowing it isn't there.

**Palette.** The plainest surface in the app. This is a tool and can look like one.

**Feels like.** A finger running down a page. Instant, no ceremony.

**Never.** Suggest searches. Keep search history. Offer trending terms. Analyse queries in any way.

---

# H. Progress

## H1 — Progress tab

**Function.** Reflects activity back: streak, this week, and for Plus, history and trends.

**Arriving.** Curious, and — this is the risk — potentially ready to feel bad about themselves. Any progress surface in a mental-health app is one design decision away from becoming another thing to fail at.

**Leaving.** With evidence that they showed up. Nothing more, nothing sharper.

**Palette.** The most restrained screen in the app. Sand, navy text, sage used sparingly for things that went well. Amber only where something can be tapped. Absolutely no red, no amber-as-warning, no colour that encodes "bad".

**Feels like.** A journal margin, not a dashboard. Sentences over numbers wherever a sentence will do — "four times this week" is a different emotional object from "4".

**Never.** Goals, targets, percentages, completion rings, comparisons to last week, comparisons to other users, badges, levels, achievements. Never show zero — an empty week shows nothing, not a row of noughts. Never editorialise a trend: if the data is flat or worsening, show it and say nothing at all.

---

## H2 — Streak

**Function.** Counts consecutive days with a journal entry or a completed worry window.

**Arriving.** Might be proud. Might be about to feel guilty.

**Leaving.** Encouraged, never indebted.

**Palette.** Sage, quiet, small. Never gold, never a flame, never a trophy — this is not a game.

**Feels like.** A note in the margin. "You're showing up for yourself" is the entire framing: the streak is evidence of self-care, not a score. Day one has its own gentle copy, because a "1" next to a big number elsewhere would feel like nothing.

**Never.** Warn that it's about to break. Notify when it does break. Show it as broken, or as a lost record. Show the longest streak — a personal best is a stick to be beaten with. When there's no streak, there is nothing on screen.

---

## H3 — Streak moment

**Function.** A brief acknowledgement, in context, when a new streak day is reached. Two soft glass notes.

**Arriving.** Just finished something real.

**Leaving.** Noticed. Not applauded.

**Palette.** Sage and amber, brief, warm.

**Feels like.** Two notes and something small catching the light. A second, maybe two, then gone. The size of the moment should match the size of the fact.

**Never.** Confetti, fireworks, a full-screen takeover, a share prompt. Never block anything. Never fire more than once a day.

---

## H4 — Week summary

**Function.** Sessions, minutes, worries handled, entries written — for the current week.

**Arriving.** Checking in.

**Leaving.** Informed, not assessed.

**Palette.** Sand, low contrast, sentences leading.

**Feels like.** Someone recounting your week back to you kindly. A quiet week is fine and should read as fine.

**Never.** Compare to last week. Highlight a decline. Set an expectation for the rest of the week.

---

## H5 — History & trends *(Plus)*

**Function.** Longer-range view: activity over months, average pre-session intensity over time.

**Arriving.** Reflective, deliberately looking back.

**Leaving.** With shape and context. Ideally: *the bad weeks passed.*

**Palette.** Warm chart colours only — amber, clay, sage. A trend line is never red. Rising intensity is never styled as alarming.

**Feels like.** Weather over a season, not a stock chart. Soft, unhurried, sparse — no gridlines fighting for attention, no dense axes, no data-density flex.

**Never.** Interpret. No "your anxiety is increasing", no insight cards, no predictions, no correlations. Show the data and let the person make their own meaning. A person is more than a line.

---

# I. Money

## I1 — Paywall

**Function.** Appears when a free limit is reached. Acknowledges what the person did, explains what Plus adds, offers plans or a clean exit.

**Arriving.** Mid-task, blocked. Already at their limit in more than one sense.

**Leaving.** Either interested, or dismissed and back to what they were doing — with **no** sense that the app just tried something on them.

**Palette.** Sand, warm, quiet. This must not be the most colourful screen in the app. Amber on the primary action; the dismissal is plainly legible, never grey-on-grey.

**Feels like.** A note, not a pitch. It opens by acknowledging what they *did* — "that's solid" — before anything about the limit. The soft brass bell that plays here is the quietest sound in the app, deliberately: being told about a limit should never feel like an alarm going off.

**Never.** Block the thing they were doing — their written text stays on screen and is kept. Never a countdown, a discount timer, "limited offer", or any scarcity cue. Never a dark pattern: "Not now" is the same size, the same weight, and appears at the same moment as "See plans". Never appear more than once a day for the same limit. And never — ever — on the panic path, in a breathing session, or during a worry window.

---

## I2 — Plans

**Function.** Presents monthly, annual, and lifetime, plus restore purchases.

**Arriving.** Considering it. Possibly wary — they were promised no accounts and no servers, and money is where apps usually break that promise.

**Leaving.** Clear on what they'd get and what it costs, with no residue of pressure.

**Palette.** Sand and amber, calm, restrained. This should look like the rest of the app, not like a landing page that got imported.

**Feels like.** A price list on a wall. Plain. All three options presented with equal dignity — **lifetime is not buried**, because for an app that promises no accounts and no servers, "buy it once and it's yours" is the option most in keeping with the premise.

**Never.** A "most popular" badge, a "best value" flag, pre-selection, strike-through prices, or per-day price maths. Never list what free *lacks*. Never make restore hard to find — with no accounts, restore is the only recovery path a person has, and hiding it would be genuinely harmful.

---

# J. Settings

## J1 — Settings

**Function.** Name, worry window, breathing defaults, sound and haptics, theme, notifications, subscription, privacy, and erase.

**Arriving.** Wanting to change one specific thing.

**Leaving.** Having changed it, quickly.

**Palette.** The plainest surface in the app. Sand, navy text, minimal accent. Settings can look like settings.

**Feels like.** A drawer. Everything findable, nothing selling anything. Grouped by what a person would call the thing, not by what the code calls it.

**Never.** Upsell rows dressed as settings. A "recommended settings" prompt. Anything that changes behaviour without being asked.

---

## J2 — Privacy

**Function.** States plainly what happens to the person's data. Which is: nothing leaves the phone, and there is no backup.

**Arriving.** Checking whether the promise is real.

**Leaving.** Trusting it — including the uncomfortable part.

**Palette.** Sand, plain, unadorned. No shield icons, no lock badges, no security theatre. Confidence doesn't need iconography.

**Feels like.** A straight answer. It says, in one honest sentence, that if the phone is lost the data is gone too. That sentence is not hidden and not softened, because overselling safety to someone trusting us with their worst thoughts would be the wrong kind of warmth — and because the moment they discover it themselves is the moment they'd stop believing everything else.

**Never.** Legalese. Hedging. Marketing language about encryption. Any claim that isn't literally true.

---

## J3 — Need more help

**Function.** Region-appropriate crisis resources, permanently available.

**Arriving.** Possibly in real danger.

**Leaving.** With a number they can call.

**Palette.** Warm and plain. Not red, not alarming, not visually set apart as a danger zone.

**Feels like.** A card on a noticeboard. Findable without searching, never pushed at anyone. And it states clearly that Calma isn't a crisis service — knowing what a tool isn't is part of what makes it trustworthy.

**Never.** Triggered automatically by anything the person writes. Their journal is not scanned, classified, or acted on — surveilling private writing to serve a helpline would break the app's central promise, and a false positive in that moment does real harm. This is always a door the person chooses to walk through.

---

## J4 — Erase everything

**Function.** Permanently deletes all local data and returns the app to first-launch state.

**Arriving.** Wanting a clean slate, or wanting out. Both are legitimate and neither should be resisted.

**Leaving.** Done, cleanly, with no attempt made to change their mind.

**Palette.** Sand. **Not red.** This is a legitimate choice, not a danger.

**Feels like.** Being taken seriously. Two deliberate steps, honest about what's lost, and then it happens.

**Never.** A retention offer. "You'll lose your 12-day streak." A discount. A survey. A "you can always come back". The absence of a fight here is the last thing the app does, and it should be consistent with everything before it.

---

# K. Cross-cutting states

## K1 — Empty states

**Function.** What a screen shows when there's nothing to show.

**Feels like.** A clear surface, not a missing thing. "Nothing waiting. That's a good place to be." reframes empty as good, which — in an app about carrying less — it genuinely is.

**Never.** An illustration of sadness. A prompt to go create something. A zero. A skeleton loader that never resolves.

---

## K2 — Waiting

**Function.** The brief moments where something is being read or written.

**Feels like.** Nothing at all, ideally. Local storage is fast enough that most of these should never render. Where one must, it should be a soft settling rather than a spinner — spinners raise heart rates.

**Never.** A spinner on the panic path. A percentage. A "please wait".

---

## K3 — Things going wrong

**Function.** The rare moments where a save fails or a purchase doesn't go through.

**Feels like.** A person telling you plainly, without drama. "That didn't save. Want to try again?" The content stays on screen — nothing the person wrote is ever lost to an error.

**Never.** Red. An error code. The words "error", "failed", or "invalid". A warning triangle. A modal that traps. Anything that makes an already-anxious person feel they broke something.

---

## K4 — Keyboard

**Function.** Present on every writing surface — worry capture, action steps, journal fields, name.

**Feels like.** Ready. On capture it should already be up. Nothing the person is typing is ever hidden behind it, and nothing jumps as it appears.

**Never.** Cover the active field. Cause a layout jump. Require dismissal before continuing.

---

## K5 — Dark mode

**Function.** Not a preference. The **primary** mode. The app's own marketing describes "the panic that hits at 2am".

**Feels like.** A room lit by one lamp. Deep navy ground, amber holding its warmth at reduced intensity so it never sears a dark-adapted eye. Not "the light design with inverted colours" — a genuinely different quality of light.

**Never.** Force brightness up. Use pure black — an OLED void is cold, and cold is the opposite of this app. Let contrast drop so far that text becomes work to read.

---

## K6 — Reduce Motion

**Function.** The experience for someone who cannot tolerate animation — including people for whom motion triggers nausea or vertigo, which overlaps meaningfully with anxiety.

**Feels like.** The same app, calmer. The orb still guides the breath, but through light and colour rather than movement. **The breathing guidance must remain completely usable** — this is not a degraded fallback, it's a second valid design, and it needs designing rather than deriving.

**Never.** Disable the breathing feature. Leave the person without a visual cue. Treat this as an edge case.

---

# The test

Before any screen is called done, ask:

> If someone opened this at 3am, shaking, having just had the worst thought they've had all year — would this screen help, or would it be one more thing to deal with?

If the answer isn't obviously the first one, it isn't finished.
