# Copy & Tone

Tone is a feature, not a coat of paint. Every string in the app is reviewed against this document before it ships.

---

## Tone guide

| Do | Don't |
|---|---|
| Warm, like a trusted friend | Clinical or diagnostic |
| Gentle but direct | Saccharine or empty positivity |
| "This is hard. Let's take a breath." | "Just think positive!" |
| Acknowledge weight without amplifying it | Dismiss or minimise |
| Human, occasionally imperfect | Corporate, polished, cold |

### Hard rules

- **Never diagnose.** No "your anxiety", "your disorder", "symptoms", "treatment", "therapy". Calma is a set of tools, not a clinician.
- **Never congratulate excessively.** "Glad that helped" is right. "Amazing work! 🎉" is not.
- **Never guilt.** No "you missed", "don't forget", "you haven't", "still nothing?".
- **Never use urgency.** No "now", "hurry", "last chance", no countdowns outside a breathing session.
- **No exclamation marks.** Zero, anywhere in the product.
- **No emoji in UI copy**, with one exception: the three post-session feeling faces.
- **Second person, present tense.** Short sentences. Contractions are fine and preferred.
- **Sentence case** for every button, header, and label. Never Title Case, never ALL CAPS.
- Say "you" more than "we". Calma is a room, not a team.

### The word list

| Never write | Write instead |
|---|---|
| "Error", "Failed", "Invalid" | "That didn't save. Want to try again?" |
| "Are you sure?" | "This one's gone for good." |
| "Complete your entry" | "Finish this whenever you like." |
| "You've reached your limit" | "That's 3 for today." |
| "Streak lost" | *nothing — we say nothing* |
| "Log" / "Track" / "Record" | "Write" / "Capture" / "Note" |
| "Session #4" | "Fourth time this week" |

---

## Microcopy registry

Strings live in `packages/i18n/src/locales/en/*.json`, namespaced by feature. Nothing in a component is a string literal — an ESLint rule flags literal JSX text in `features/`. See `systems/10-i18n.md` and D-011.

```json
{
  "captureHint": "What's on your mind?",
  "captured": "Got it. I'll hold onto this until {{time}}.",
  "pending_one": "You have 1 thing waiting.",
  "pending_other": "You have {{count}} things waiting."
}
```

The tables below are the source of truth for **tone**. The JSON is the source of truth for **the string**. When they disagree, this document wins and the JSON gets fixed.

Two rules that this document imposes on the i18n layer:

- **One key, one complete sentence.** Never assemble a sentence from fragments — it breaks in every language with gender or non-SVO order, and it makes tone impossible to review.
- **Every count-bearing string has plural forms.** "1 things waiting" is a tone failure, not just a grammar one.

### Panic

| Key | Copy |
|---|---|
| `panic.opening` | "Right now, just breathe. Everything else can wait." |
| `panic.dismiss` | "I'm okay" |
| `panic.end` | "You're still here. That's enough." |

### Breathing

| Key | Copy |
|---|---|
| `breathe.phase.inhale` | "Breathe in" |
| `breathe.phase.holdFull` | "Hold" |
| `breathe.phase.exhale` | "Breathe out" |
| `breathe.phase.holdEmpty` | "Rest" |
| `breathe.sigh.second` | "One more sip of air" |
| `breathe.extend` | "Want to keep going?" |
| `breathe.extendYes` | "A bit longer" |
| `breathe.extendNo` | "I'm done" |
| `breathe.stopConfirm` | "Stop here?" |

### SUDS (D-007)

| Key | Copy |
|---|---|
| `suds.pre.prompt` | "Where are you right now?" |
| `suds.pre.low` | "Steady" |
| `suds.pre.high` | "Overwhelming" |
| `suds.pre.skip` | "Skip this" |
| `suds.post.prompt` | "How are you feeling now?" |
| `suds.post.better` | 😌 Better → "Glad that helped." |
| `suds.post.same` | 😐 Same → "Sometimes writing helps untangle things. Want to try?" |
| `suds.post.worse` | 😔 Worse → "That sounds really hard. Want to talk it through on paper?" |

### Worry capture

| Key | Copy |
|---|---|
| `worry.captureHint` | "What's on your mind?" |
| `worry.captured` | "Got it. I'll hold onto this until {time}." |
| `worry.pending` | "You have {n} things waiting." / "You have 1 thing waiting." |
| `worry.none` | "Nothing waiting. That's a good place to be." |
| `worry.windowIn` | "Your window opens in {duration}." |
| `worry.openNow` | "Open it now" |

### Worry window

| Key | Copy |
|---|---|
| `window.intro` | "You saved this earlier. Let's look at it with fresh eyes." |
| `window.question` | "Is this something you can do something about?" |
| `window.yes` | "Yes" |
| `window.no` | "Not really" |
| `window.step` | "What's one small step?" |
| `window.stepHint` | "Doesn't have to be big." |
| `window.release` | "Then this one isn't yours to carry." |
| `window.releaseAction` | "Swipe up to let it go" |
| `window.summary` | "You captured {n} worries today. {a} were within your control — you made a plan. {b} weren't — you let them go. How does that feel?" |
| `window.summaryAllReleased` | "You let all {n} of them go. That took something." |
| `window.summaryAllActioned` | "All {n} had a next step. You've got a plan." |
| `window.leave` | "The rest can wait" |

The summary has three variants because the generic one reads wrong when every worry went the same way.

**Amended in session 7.** `window.summary` was one string carrying three counts.
ICU pluralises on `count` and on nothing else, so `{a}` and `{b}` would have
produced "1 were within your control". It is now four keys — captured,
actioned, released, and the closing question — each a complete sentence with
its own plural forms, rendered as consecutive sentences. This is not sentence
assembly from fragments: no key is a clause, and a translator can reorder
within each one freely.

### Journaling

| Key | Copy |
|---|---|
| `journal.offer` | "That felt intense. Want to write down what was going on?" |
| `journal.offerYes` | "Let's write" |
| `journal.offerNo` | "Not right now" |
| `journal.situation` | "What happened?" |
| `journal.situationHint` | "Just the facts, a sentence or two." |
| `journal.thought` | "What went through your mind?" |
| `journal.emotion` | "What did you feel?" |
| `journal.intensity` | "How strong was it?" |
| `journal.evidenceFor` | "What makes that thought feel true?" |
| `journal.evidenceAgainst` | "What doesn't quite fit?" |
| `journal.balanced` | "If a friend said this to you, what would you tell them?" |
| `journal.reRate` | "And now — how strong is it?" |
| `journal.saved` | "Saved. That's yours." |
| `journal.draftSaved` | "Kept as a draft. Come back whenever." |

`journal.balanced` is deliberately not "What's a more balanced thought?" — that phrasing asks someone in distress to perform cognitive restructuring on command. The friend framing gets to the same place and is easier to answer.

### Progress & streak

| Key | Copy |
|---|---|
| `progress.streak` | "{n} days in a row. You're showing up for yourself." |
| `progress.streakOne` | "That's day one." |
| `progress.thisWeek` | "This week" |
| `progress.empty` | "We'll start keeping track as you go." |

### Paywall

| Key | Copy |
|---|---|
| `paywall.journal` | "You've done 2 entries this week — that's solid. With Calma Plus, you can write as often as you like and look back on your progress over time." |
| `paywall.worry` | "That's 3 for today. You can still open your window and work through them. With Calma Plus, you can capture as many as you need." |
| `paywall.history` | "This is your week. Calma Plus keeps the whole picture." |
| `paywall.customRatio` | "The three presets cover most of it. Calma Plus lets you build your own rhythm." |
| `paywall.primary` | "See plans" |
| `paywall.secondary` | "Not now" |
| `paywall.restore` | "Restore a purchase" |

### Settings & privacy

| Key | Copy |
|---|---|
| `settings.name` | "What should we call you?" |
| `settings.nameHint` | "Only stored on this phone. Leave it blank if you'd rather." |
| `settings.privacy` | "Everything you write stays on this phone. There are no accounts and no servers. Nothing is backed up — if you lose this phone, this is gone too." |
| `settings.erase` | "Erase everything" |
| `settings.eraseConfirm` | "This deletes every worry, entry, and session. It can't be undone." |
| `settings.eraseFinal` | "Erase it all" |
| `settings.silentSwitch` | "Calma stays quiet when your phone is on silent. Haptics still work." |

That privacy line is deliberately blunt about data loss. Overselling safety to someone who is trusting us with their worst thoughts would be the wrong kind of warmth.

---

## Crisis handling

Calma is not a crisis service and must not pretend to be. It also cannot ignore that some people will open it in a crisis.

- A **"Need more help?"** row sits permanently in Settings, listing region-appropriate crisis lines. It is not hidden, and it is not shoved in anyone's face.
- The journal's free-text fields are **not scanned, classified, or acted upon**. No on-device sentiment analysis, no keyword triggers. Surveilling someone's private writing to serve a helpline would break the app's central promise, and false positives in that moment do real harm.
- App Store metadata and the marketing site both state clearly that Calma is a self-help tool, not treatment, and not a substitute for professional care.

---

## Onboarding copy

Namespace `onboarding`. Full flow in `systems/11-onboarding.md`.

| Key | Copy |
|---|---|
| `welcome.tagline` | "Breathe into it." |
| `crisisExit` | "I need this now" |
| `language.title` | "Is this right?" |
| `language.hint` | "We guessed from your phone. Change it if we got it wrong." |
| `language.default` | "Detected" |
| `questions.why` | "What brings you here?" |
| `questions.whyHint` | "Pick as many as fit." |
| `questions.why.night` | "Racing thoughts at night" |
| `questions.why.panic` | "Panic that comes out of nowhere" |
| `questions.why.worry` | "Worry I can't put down" |
| `questions.why.tense` | "A tightness that won't leave" |
| `questions.when` | "When is it hardest?" |
| `questions.when.night` | "Late at night" |
| `questions.when.morning` | "First thing in the morning" |
| `questions.when.day` | "During the day" |
| `questions.when.unpredictable` | "It's hard to say" |
| `questions.helped` | "Has anything helped before?" |
| `questions.helped.breathing` | "Breathing" |
| `questions.helped.writing` | "Writing it down" |
| `questions.helped.talking` | "Talking to someone" |
| `questions.helped.nothing` | "Nothing yet" |
| `breath.intro` | "Let's try one now. Follow the light." |
| `breath.hint` | "You can close your eyes and feel it instead." |
| `reveal.title` | "Here's your Calma." |
| `reveal.window` | "Your worry window is set for {{time}}. You can change it any time." |
| `reveal.windowUnsure` | "We've set your worry window for {{time}} to start with. Move it whenever you like." |
| `reveal.panic` | "That button you just used stays with you, on every screen. One tap, whenever you need it." |
| `notifications.title` | "Want a nudge before your window?" |
| `notifications.body` | "That's the only thing we'll send." |
| `notifications.yes` | "Yes, remind me" |
| `notifications.no` | "No thanks" |
| `skip` | "Skip" |
| `continue` | "Continue" |

`questions.helped.nothing` is phrased "Nothing yet" rather than "Nothing" on purpose. The two words carry very different implications for someone who has tried a lot of things.

`reveal.windowUnsure` exists because telling someone who answered "it's hard to say" that their window is confidently set would be a small lie.

### Founder note

Short, handwritten, signed. Not drafted here — it has to be actually yours, in your own words, or it will read as a growth tactic wearing a cardigan. What it should contain: why you built this, one specific honest thing, and no promises about outcomes. Six sentences at most.

---

## Retired: walkthrough script

The voice track is removed (D-012). The script is kept here because its lines are the best copy in the product, and several are reused as on-screen text during onboarding.

Voice direction, no longer needed but preserved for context: warm, unhurried, slightly low in pitch. Pauses matter. Conversational, not ASMR.

> Hey. Welcome to Calma.
> *[pause]*
> This is a space for you. No judgment. No pressure. Just a few tools to help when things feel like too much.
> *[pause]*
> When you're really struggling — that's when you'll find the calm button. It's always there, bottom of your screen. One tap, and we'll breathe together. No questions asked.
> *[pause]*
> There's breathing exercises too. You can follow along with your eyes open, or close them and just feel the gentle pulse in your hand.
> *[pause]*
> And when your mind won't stop — you know that feeling — you can capture a worry, set it aside, and come back to it later. On your terms.
> *[pause]*
> There's also a place to write. Not a diary. Just somewhere to untangle things when they get knotted up.
> *[pause]*
> Everything you put into Calma stays here. On your phone. Nowhere else. No accounts. No servers. This is yours.
> *[pause]*
> Take your time. Look around. Or just sit here and breathe for a minute.
> *[pause]*
> Wherever you are right now — I'm glad you're here.

**Changed from the blueprint:** "right at the top" → "bottom of your screen", per D-006. Also added the missing full stop after "breathe for a minute", which affects the read.

**Lines reused as on-screen onboarding copy:** the opening welcome, "close them and just feel the gentle pulse in your hand" (→ `breath.hint`), "Everything you put into Calma stays here. On your phone. Nowhere else." (→ the privacy beat), and "Wherever you are right now — I'm glad you're here." (→ the last thing shown before Home).

---

## Settings — language

| Key | Copy |
|---|---|
| `settings.language` | "Language" |
| `settings.languageSystem` | "Match my phone" |
| `settings.languageHint` | "Calma follows your phone's language. Change it here if you'd rather." |

"Match my phone" is the default and is described as a behaviour, not a setting value — because it's live, not a snapshot (`systems/10-i18n.md`).

---

## App Store copy

**Name:** Calma
**Subtitle:** Your pocket companion for anxiety. Breathe, write, let go — one gentle step at a time.

**Description:**

> Not another meditation app. Just a warm, human place to land when things feel like too much.
>
> Calma is built for the moments that matter — the panic that hits at 2am, the worry spiral you can't shake, the feeling that won't loosen its grip. No lectures. No guilt. Just tools that actually help, wrapped in a voice that feels like a friend.
>
> **WHAT'S INSIDE**
>
> ▪️ **Breathe** — Paced breathing and the physiological sigh, with haptic guidance so you can close your eyes and just follow the pulse
> ▪️ **Worry Later** — Capture anxious thoughts as they come, then process them during a dedicated worry window. Learn what's yours to hold and what's safe to release
> ▪️ **Write It Out** — Structured journaling prompts that help untangle thoughts, not just record them
> ▪️ **One-Tap Calm** — A panic button that launches instant relief, no questions asked
>
> **WHY IT'S DIFFERENT**
>
> No accounts. No servers. Your thoughts stay on your phone, always. Calma is a space that's entirely yours — private, warm, and judgment-free.
>
> Calma is a self-help tool. It isn't therapy and isn't a substitute for professional care.

That last line is an addition. Both stores scrutinise mental-health claims, and it's true.

---

## i18n

English only in V1. The copy modules are structured so a later `t()` layer is a mechanical change rather than a rewrite. Interpolation always uses named placeholders, and no sentence is assembled from concatenated fragments.
