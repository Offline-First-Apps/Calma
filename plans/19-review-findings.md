# 19 — Changes from Competitor Review Analysis

Design changes derived from App Store reviews of a puzzle game and of **Stoic**, a journaling and mental-health app in Calma's category.

**Hand this to the designer alongside `plans/17-screens.md`.** Screen references (C1, F2, G4…) point at sections in that document.

---

## What was discarded

Most of the puzzle-game feedback was about game economy — hearts as lives, coin balances, rewarded-video ads, ad banners appearing mid-level. Calma has no lives, no currency, and no ads. None of that transfers and none of it is below.

What survives from those reviews is the handful of complaints that were about **interface behaviour** rather than game design. Those apply to any app.

The Stoic reviews are from the same product category and transfer almost wholesale.

---

# Findings

## R1 — Input that hesitates makes people tap twice, and the second tap does damage

> *"It doesn't always insert the selected letter immediately, but hesitates for about three seconds, then moves to a different spot. If you don't realize what's happening and you tap a letter, you get an error and use a mistake."* — 4★

A delayed response doesn't read as slowness. It reads as *the tap didn't register*, so the person taps again — and the second tap lands somewhere they didn't intend. This reviewer knocked a star off an app they otherwise enjoyed, purely over this.

Calma's exposure is worse than a puzzle game's, because the people most likely to tap repeatedly are the ones whose hands are shaking.

**Where it bites, in order of severity:**

| Screen | The failure |
|---|---|
| **E1** Panic button | Two taps launch two sessions, or the second tap lands on the session screen underneath and dismisses it. Someone in a panic attack taps a button that didn't visibly respond. Repeatedly. |
| **F2** Worry capture | Submit lags → they hit it again → the same worry is stored twice → their pending count is wrong and the window shows them the same thought back to back. |
| **F7** Worry release | The swipe is permanent. A gesture that hesitates and then completes on a re-attempt could release the wrong worry. |
| **G4** Journal save | Double-save creates a duplicate entry, and on free tier burns both weekly allowances at once. |
| **D6 / B8** Feeling check | Double-tap registers two answers; the second may overwrite the first. |

**The change.** Every destructive or state-changing tap in the app responds within one frame — visibly, before any work happens. The visual acknowledgement is the *first* thing, not the result of the operation. Any action that writes to storage or navigates is idempotent for at least 600ms after it fires.

For the panic button specifically: the response must be instantaneous and unmistakable. The drum, the haptic, and the visual change all land on the same frame as the touch, before the session screen has even mounted.

---

## R2 — One element ignoring the font scale ruins the screen it's on

> *"The letters in the keyboard can be enlarged but the numbers that corresponds the letter is super small."* — 3★

App-wide font scaling was implemented, and one class of element was missed. The result is worse than not supporting scaling at all, because the person now knows the app *can* do it and simply didn't bother for the part they needed.

Numbers are the usual casualty. They get treated as ornament rather than text.

**Where it bites:**

| Screen | The element |
|---|---|
| **D2** Pre-session intensity | The 0–10 value, and the scale's end labels |
| **H2** Streak | The streak digit — often styled as display type and hard-coded |
| **F1** Worries tab | The pending count and the window countdown |
| **G3** Journal re-rating | Both intensity values and the delta |
| **H4 / H5** Week summary and trends | Every figure, plus chart axis labels |
| **G6** Entry list | Dates and timestamps |

**The change.** Numbers are text. Every numeral in the app scales with the system font setting, including anything drawn inside a chart. The audit at 200% covers numeric elements explicitly, not just prose.

---

## R3 — Losing work is unforgivable, and people say so in the review

> *"It keeps taking me out. I'm almost finished with level 19 and it's taking me out back to the beginning so many times… can't do that anymore, uninstalling. I absolutely love the game."* — 1★

Note the shape of that review: they loved it, and uninstalled anyway. Lost progress overrides affection.

A puzzle level is disposable. **A half-written journal entry is not.** It may be the most emotionally costly thing the person has produced all week, written while distressed. Losing it would be the single most damaging bug Calma could ship — worse than a crash, because a crash doesn't take anything with it.

**Where it bites:**

| Screen | The failure |
|---|---|
| **G2** Journal editor | A crash, a force-quit, or a phone call loses everything since the last save |
| **F6** Worry action step | A typed next-step lost on interruption |
| **F4–F8** Worry window | Interrupted mid-triage and restarted from the first worry |
| **B4–B11** Onboarding | Backgrounding loses the answers given so far |

**The change.** The journal editor saves continuously, not on blur — a force-quit loses at most the last few keystrokes. Nothing the person has typed is ever cleared from the screen by an error, a limit, or a navigation. And the worry window resumes at the exact worry it was interrupted on, never from the start.

---

## R4 — Monetisation that interrupts is remembered as a betrayal

> *"Then they did the unacceptable. They started to launch the ad at the bottom of the screen in the middle of your game. That is a sneaky, underhanded, and unforgivable tactic. So this game is getting deleted and a bad review and I hope no one ever downloads this game again."* — 1★

The mechanics of this don't transfer — Calma has no ads. **The intensity does.** This person accepted ads, accepted a slow coin economy, accepted difficulty. What broke them was something commercial appearing *during* the thing they were concentrating on.

Calma has exactly one commercial surface, and it can make the same mistake.

**The change — hardening the existing rule.** The paywall (**I1**) may not appear when:

- a breathing or panic session is running, at any point including the ending
- the worry window is open, at any step
- the journal editor is open, at any step
- **any text field anywhere in the app has focus**
- an animation the person is watching is mid-flight
- within a few seconds of a session, window, or entry completing — the settling moment belongs to them

The paywall waits for a boundary. It never arrives during, and never immediately after.

**Related — R4b.** The same reviewer wrote *"it was designed to cause you to fail."* Once someone suspects friction is deliberate and commercial, every design decision gets reread in that light.

Calma's exposure is the **3-worries-per-day cap (F2)**. A capture limit on an anxiety app can absolutely read as manufactured — *they cap it so I'll pay when I'm spiralling.* Mitigations: never disable the field, always point at what they can still do ("you can still open your window and work through them"), never show a remaining-count meter that turns the limit into a visible countdown, and never let the limit interrupt a capture already in progress.

---

## R5 — Repeating a small friction turns a fine interaction into an annoying one

> *"After a bunch of levels you start to find it redundant."* — 3★

An interaction that's fine once is not automatically fine five times in a row. This is largely game-mechanical, but it lands on one Calma surface.

**Where it bites: F2, worry capture.** A spiral doesn't produce one worry, it produces four in ninety seconds. The confirmation animation, the pebble sound, and the settle are lovely the first time. If the field isn't ready again immediately, they're a wall by the fourth.

**The change.** The field accepts new input the moment the previous worry is submitted — the confirmation plays over an already-live field rather than blocking it. Capturing four worries in quick succession must feel like emptying your pockets, not like four separate transactions.

---

## R6 — Choice on arrival is overwhelming, even to people who like the app

> *"You're greeted with a lot of choices and it can be overwhelming, but there are discernible components: a mood check-in, guided meditations, guided breathing exercises, journaling prompts, affirmations."* — 4★, Stoic

This is a **positive** review of a well-liked app in Calma's exact category, and the first thing it says about the home screen is that it's overwhelming.

Calma's Home (**C1**) is far simpler, and the tab bar is about to grow from four to five. This is the finding to hold onto while that happens.

**The change.** Home offers **one obvious next thing**, sized and placed accordingly, with everything else quieter. The five tabs are navigation, not five options presented as equals on arrival. A first-time visit to Home after onboarding shows less, not more.

---

## R7 — People want a direct path to the primary action

> *"If I could request anything for a future version it would be a quicker way to create journal entries without having to wade through the other elements."* — 4★, Stoic

This exposed a real hole in Calma's spec, not just a preference.

Journaling was reachable **only** as an offer after a high-distress breathing session. Someone who wants to write — right now, without breathing first — had no route. And the entry list specced in `plans/09-journaling.md` had no home in the navigation at all.

That framing also carries a bad implication: writing is what you do when breathing didn't work. It isn't. It's a tool in its own right, and for some people it's the primary one.

**The change — this is the largest structural change in this document.**

Navigation goes from four tabs to five:

**Home · Breathe · Write · Worries · Progress**

The Write tab is a first-class destination containing: a way to start writing immediately, unfinished drafts, and past entries. The post-session offer (**G1**) stays exactly as it is — it's a good moment — but it is no longer the only door.

See **G0** in `plans/17-screens.md` for the screen brief.

---

## R8 — "It feels like mine" is the thing that earns five stars

> *"It's thoughtful. It's personal. More than anything, it feels like mine. I genuinely feel a connection to it… I am allowed to be myself here."*
> *"It can be so difficult when you have a mental illness to take that first step, but this app really helps."* — 5★, Stoic

No change required. This is confirmation that the direction is right: the onboarding personalisation with visible consequences (**B9**), the no-judgement tone, and the one-tap panic path all target exactly what this person is describing.

Worth keeping in view: *"so difficult to take that first step"* is the single best argument for everything Calma does to remove friction from the panic button and from worry capture. The first step being easy **is** the product.

---

## R9 — Noted, and deliberately not acted on

Two things where the evidence points one way and we're going the other. Recording both so the reasoning survives.

**Free access to history.** The Stoic 5★ review praises, by name, that history and mood trends aren't paywalled: *"This isn't like most journaling apps, where it's designed to let you write things and has other functions hidden behind a paywall. You're allowed to see how your mood has changed. You can go back and see what you've written."*

Calma keeps its current tiers — current week free, full history on Plus (decision confirmed, see D-016). The risk is real and specific: the free-tier experience of hitting a wall in front of *your own words* is the exact feeling this reviewer was relieved not to have. **If Plus conversion is weak or reviews mention this, it's the first thing to change.** The mitigation meanwhile is in **I1** and **T10** of `plans/11` — a soft prompt, never blurred or teased content, and never the implication that their writing is being held hostage.

**Word clouds and writing patterns.** The same reviewer wanted a word cloud of their most-used words. Calma does not analyse journal text, and that stands. An unprompted *"your most-used word this month is worthless"* is a genuine harm, and the promise that nothing reads your writing is more valuable than the feature. Not in V1, not in the backlog.

---

# Amendments

| File | Change |
|---|---|
| `systems/01-architecture.md` | Four tabs → five. Write tab and its routes added. |
| `systems/09-decisions.md` | D-015 (five tabs, journaling first-class), D-016 (tiers confirmed unchanged, with the recorded risk). |
| `plans/17-screens.md` | New **G0 — Write tab**. Section C1 amended for one-obvious-thing. |
| `plans/02-design-system.md` | +1 todo: numerals scale with system font. |
| `plans/05-app-shell.md` | T03 amended: five-tab layout. |
| `plans/07-panic-button.md` | +1 todo: single-frame response and double-fire protection. |
| `plans/08-worry-postponement.md` | +1 todo: rapid repeat capture and idempotent submit. |
| `plans/09-journaling.md` | +2 todos: Write tab screen, continuous autosave. |
| `plans/11-entitlements-paywall.md` | +1 todo: paywall interruption guard. |
