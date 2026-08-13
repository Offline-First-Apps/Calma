# Onboarding

Eleven steps. Roughly two minutes. By the end, the person has already breathed, already been told what the app will do with their data, and already has a Calma shaped slightly to them.

This document adapts a growth-onboarding playbook to an anxiety app. Most of the playbook applies. Two parts of it would actively harm this product, and they're named below rather than quietly dropped.

---

## The playbook, and what happens to it here

| Principle | Applied to Calma |
|---|---|
| Long flows correlate with successful apps | 11 steps. Adopted — with a crisis escape (below), which is not optional. |
| Flow is: sign up → set up → aha → habit | **No signup exists.** Flow is: set up → aha → habit. |
| Sell the outcome, not the features | The first screen is the orb breathing. No feature list anywhere in onboarding. |
| Let people try the core experience before committing (Alma) | Step 6 is a **real breathing session**, not a demo. It's recorded as their first session. |
| Make it human — handwritten notes, hand-drawn marks (OneYear) | **Dropped** (D-019). See below. |
| Personalise with multi-select, conversationally | Steps 3–5 are three multi-select questions in plain speech. |
| Show what the personalisation unlocked (Endel, Brilliant) | Step 8 states explicitly what each answer changed. |
| Custom screen before a native permission prompt (Centr) | Step 9 shows the actual notification they'd receive, before the OS dialog. |
| Make long flows feel short (Duolingo) | Quiet progress indication, one question per screen, and the aha moment sits in the middle rather than at the end. |
| Teach the user, hold their hand | The panic gesture is taught by *use*, not by a coach mark. |
| Split signup across screens for conversion (Houzz) | N/A — nothing to sign up for. |
| **Paywall in onboarding with a one-time urgency offer** | **Rejected.** See below. |
| Social proof before the paywall | **Rejected.** No paywall to precede. |

---

## The two rejections

### No paywall in onboarding

The blueprint already settled this — *"No trial — free tier is the ongoing demonstration"* — and the tone guide bans urgency and scarcity outright.

Beyond consistency, there's a substantive reason. Urgency is a manufactured stress response. Calma exists to reduce stress responses. An app that opens by inducing the exact feeling it promises to relieve has told the user what it actually is, in its first ninety seconds, and they will believe it.

Plus is discovered organically, at a limit, after the app has already proved useful. See `systems/05-entitlements.md`.

### No social proof

"Join 40,000 people managing their anxiety" is a reasonable line in most categories. Here it says: *we know how many people are anxious, and we're counting you*. The privacy promise ("no accounts, no servers") and a user counter contradict each other in a way an attentive person will notice.

---

## The crisis escape — the one non-negotiable

**An 11-step onboarding is a wall in front of someone having a panic attack.**

Some people will download Calma *during* the thing it's for. The App Store description promises "the panic that hits at 2am". Someone acting on that promise must not meet a quiz.

So, from the very first screen and every screen after:

- A persistent, plainly-worded **"I need this now"** exit.
- It goes straight to a panic session. No questions, no confirmation, nothing between the tap and the orb.
- Onboarding is not lost. After that session ends, they land on a working Home with sensible defaults.
- They are offered the rest of onboarding **once**, gently, at a later launch — never immediately after, never repeatedly, never as a blocking prompt.
- A person who never completes onboarding must have a completely functional app. Every step's outcome has a working default.

This inverts the usual growth logic on purpose. The onboarding is optimised for the calm arrival, and abandoned instantly for the distressed one.

---

## The aha moment

For Airbnb it's the first booking. For Netflix it's finding a show. For Calma:

> **The first breath cycle where the haptic pulses in their hand and they realise the app is doing something to their body, not showing them a screen.**

That's the whole product in about eight seconds. It's why the aha moment is step 6 of 11 rather than the finale — everything after it is set-up that now has an obvious reason to exist, and the person is calmer while doing it.

It is a **real session**, not a preview. Recorded, counted, real. Their first session happens before onboarding ends.

---

## The flow

| # | Step | Purpose | Skippable |
|---|---|---|---|
| 1 | Welcome | Outcome, not features. The orb, breathing. | — |
| 2 | Language | Device-detected, correctable. | auto-advance if confident |
| 3 | What brings you here | Multi-select. | yes |
| 4 | When is it hardest | Multi-select → seeds worry window time. | yes |
| 5 | What's helped before | Multi-select → seeds Home. | yes |
| 6 | **First breath** | **The aha moment.** Real session. | yes |
| 7 | How was that | One tap. Feeds step 8. | yes |
| 8 | Here's your Calma | Shows what their answers changed. | — |
| 9 | Notifications | Custom pre-prompt, then the OS dialog. | yes |
| 10 | Name | Optional, on-device. | yes |
| 11 | Home | Personalised. | — |

**Screen IDs are NOT renumbered.** The delivered designs use B1–B11 with B3 as
the founder note; B3 is simply removed and B4–B11 keep their IDs. Renumbering
would break every reference into `designs/extracted/`.

Every step is skippable except 1, 8, and 11 — and those three ask for nothing.

### What each answer actually changes

Personalisation that changes nothing is extraction. Every question here has a mechanical consequence:

| Answer | Effect |
|---|---|
| "Late at night" (step 4) | Worry window defaults to 20:00 |
| "First thing in the morning" | Worry window defaults to 08:00 |
| "During the workday" | Worry window defaults to 18:00 |
| "It's unpredictable" | Worry window defaults to 19:00, and step 8 says so plainly |
| "Writing it down" (step 5) | Journal surfaced on Home |
| "Breathing" | Breathing surfaced on Home |
| "Nothing yet" | Home leads with the sigh, the lowest-effort tool |
| Panic selected (step 3) | Step 8 names the panic button explicitly |

Answers are stored in prefs and are **editable in Settings**. A person who mis-taps at 2am isn't stuck with it.

### Where the warmth lives now

The founder note is cut (D-019). It was carrying the human warmth that the
removed voice track used to, so that job now falls entirely on two things:

1. **The first breath (step 6)** — the aha moment. Someone feeling the app work
   on their body is more persuasive than any note about why it was built.
2. **The copy, everywhere.** "You're still here. That's enough." does more than
   a signature would.

If onboarding starts to feel transactional, this is the reason, and the fix is
the copy — not a reinstated note.

### The progress indicator exception

`plans/17-screens.md` bans progress bars app-wide. Onboarding is the deliberate exception.

The reasoning differs by context. In a breathing session, a progress indicator turns rest into a task being completed. In onboarding, *not* knowing how much is left is its own low-grade anxiety — and reducing that is precisely on-brand.

It must be quiet: a sense of position, not a percentage, not a step count read aloud as "4 of 11".

---

## Teaching the panic button

The single most important thing a new user can know is that one tap reaches breathing from anywhere.

A coach mark pointing at it would be the obvious solution and would be wrong — `plans/17-screens.md` bans them, and an arrow with a tooltip is exactly the corporate register the tone guide exists to avoid.

Instead: **step 6 is launched from an affordance that looks and behaves like the panic button, in the position the panic button will occupy.** The person learns the gesture by performing it, at the moment it first pays off. Step 8 then names it in one sentence.

Teaching by use, not by annotation.

---

## Re-entry

- Onboarding shows once. `prefs.onboardingCompletedAt` is set on completion **or on skip**, and survives app updates.
- If it was escaped via "I need this now", a single gentle offer to finish appears on a later launch. Once. Declining is permanent.
- Everything set during onboarding is changeable in Settings, and Settings is where people are pointed if they want to revisit it.
- There is no "replay onboarding" — the walkthrough that used to justify it no longer exists (D-012).

---

## What onboarding must never do

- Ask for an account, an email, or a social login. There is nothing to sign in to.
- Show a paywall, a price, a plan, or the word "Plus".
- Request a notification permission without the custom screen first.
- Request app-store review.
- Block the crisis escape on any screen, for any reason.
- Claim a clinical outcome. Nothing here says Calma treats, cures, or reduces anxiety as a medical matter.
- Use a countdown, a timer, or any urgency device.
- Require a single answer to proceed.
