# Translating Calma

Thank you for taking this on. Please read this before you translate a single
string — it will take five minutes and it matters more than the strings do.

Calma is used by people who are anxious, sometimes at three in the morning,
sometimes in the middle of a panic attack. **Tone is the product.** A
translation that is accurate and cold is a failed translation. If you have to
choose between literal accuracy and the right feeling, choose the feeling and
leave a note.

---

## The voice

Calma sounds like a trusted friend who happens to know what they're doing.
Warm, unhurried, direct. Never clinical, never cheerful, never a brand.

| Aim for | Avoid |
|---|---|
| Warm, like a trusted friend | Clinical or diagnostic |
| Gentle but direct | Saccharine, empty positivity |
| "This is hard. Let's take a breath." | "Just think positive" |
| Acknowledging weight without amplifying it | Dismissing or minimising |
| Human, occasionally imperfect | Corporate, polished, cold |

Say "you" far more than "we". Calma is a room, not a team.

---

## Hard rules

These are not stylistic preferences. A string that breaks one of them will
fail the automated check and be sent back.

1. **No exclamation marks. Zero. Anywhere.** In any language, in any string.
2. **Never diagnose.** No "your anxiety", "disorder", "symptoms", "treatment",
   "therapy", "patient". Calma is a set of tools, not a clinician. The one
   exception is the crisis row, which says plainly what Calma is *not*.
3. **Never guilt.** No "you missed", "don't forget", "you haven't yet".
4. **Never hurry.** No "now", "quickly", "last chance". No countdowns outside a
   breathing session.
5. **No emoji.** The three feeling faces are drawn by the app, not written here.
6. **Sentence case** for every button, header and label. Never Title Case,
   never ALL CAPS — including in languages where marketing convention allows it.
7. **Second person, present tense.** Short sentences. Contractions where your
   language has them.
8. **Never say anything about a lost streak.** If a phrase implies falling
   behind, rewrite it.

---

## The word list

| Never write | Write something like |
|---|---|
| "Error", "Failed", "Invalid" | "That didn't save. Want to try again?" |
| "Are you sure?" | "This one's gone for good." |
| "Complete your entry" | "Finish this whenever you like." |
| "You've reached your limit" | "That's 3 for today." |
| "Streak lost" | *nothing — say nothing* |
| "Log", "Track", "Record" | "Write", "Capture", "Note" |
| "Session #4" | "Fourth time this week" |

---

## Mechanics

### Keys are structure, not text

Never translate a key. `worry.captured` stays `worry.captured` in every file.

### Placeholders

Interpolation looks like `{{time}}` or `{{count}}`. Keep the braces and the
name exactly as they are. **You may move a placeholder anywhere in the
sentence** — that is why they are named rather than numbered. Reorder freely if
your language wants a different order.

### Plurals

Any key ending `_one` or `_other` is a plural form. English needs two. Your
language may need one, three, four or six — add exactly the forms your language
takes (`_zero`, `_two`, `_few`, `_many`), and delete the ones it does not.
Never write one form and hope; "1 things waiting" is a tone failure, not just a
grammar one.

`{{count}}` is the number. It is substituted automatically.

### One key, one whole sentence

Do not split a sentence across keys or join two keys into one. If a sentence
genuinely cannot work as a single unit in your language, leave a note rather
than restructuring it — the code renders these in a fixed order.

### Length

Aim to stay within about 130% of the English. Beyond that, layouts begin to
clip on small phones at large font sizes. If a string cannot be shortened
without losing warmth, keep the warmth and flag it.

---

## Namespaces

| File | Covers |
|---|---|
| `common.json` | Buttons and generic actions used everywhere |
| `onboarding.json` | The eleven-step first run |
| `breathing.json` | Breathing sessions, the panic button, the distress scale |
| `worry.json` | Capturing worries and the worry window |
| `journal.json` | The written thought record |
| `progress.json` | Streak and weekly summary |
| `entitlement.json` | Paid plans and limits |
| `settings.json` | Settings, privacy, erasing data |
| `notifications.json` | The four notifications the app can send |

---

## Keys that need context

**`onboarding.questions.helped.nothing`** — "Nothing yet". The "yet" is
deliberate and load-bearing. Someone who has tried many things and found none
of them helpful should not read a flat "Nothing". Keep the sense of an open
door.

**`journal.balanced`** — "If a friend said this to you, what would you tell
them?" This is deliberately *not* "What's a more balanced thought?". Asking
someone in distress to perform cognitive restructuring on command does not
work. Keep the friend framing.

**`onboarding.reveal.windowUnsure`** — Shown only to someone who answered "it's
hard to say" about when things are hardest. It is hedged on purpose; telling
them their window is confidently set would be a small lie.

**`settings.privacy`** — Blunt about data loss on purpose. Do not soften it.
Overselling safety to someone trusting us with their worst thoughts would be
the wrong kind of warmth.

**`breathing.panic.end`** — "You're still here. That's enough." This is the
last thing someone reads after a panic session. It should land as relief, not
as praise.

**`worry.window.release`** — "Then this one isn't yours to carry." The image is
of setting something down, not of getting rid of it.

**`breathing.phase.*`** — One word each, read while someone's eyes may be
closed and their breathing is being paced by them. Short beats accurate.

**`onboarding.welcome.tagline`** — "Breathe into it." The first thing anyone
sees. It should feel like an invitation, not an instruction.

---

## Before you send it back

- Read every string aloud. If any of it sounds like a company talking, rewrite.
- Check you have no exclamation marks. Search the file.
- Check every `{{placeholder}}` survived, spelled identically.
- Check your plural forms match your language's actual rules.
- Tell us about anything you had to compromise on. We would rather know.
