# Audio & Haptics

Calma is quiet by design. Seven short sounds, one voice track, and a small haptic vocabulary. **There is no audio during breathing** — breathing is guided by the orb and by haptics only.

---

## Library

`expo-audio` (the current Expo audio module; `expo-av` is deprecated). Sounds are preloaded once at boot into a `SoundBank` in `lib/audio.ts`.

### Audio session configuration

```ts
setAudioModeAsync({
  playsInSilentMode: false,          // respect the mute switch — see below
  interruptionMode: 'mixWithOthers', // never stop the user's music
  shouldPlayInBackground: false,
  shouldRouteThroughEarpiece: false,
});
```

**Silent switch.** Calma respects it. If someone has silenced their phone at 2am, we do not override that to play a singing bowl. Haptics still fire. This is deliberate and is stated in Settings.

**Ducking.** We never duck. We mix. Someone may be breathing along to their own music; a 0.8-second pebble sound should not interrupt it. With the voice track removed (D-012) there is no exception to this — nothing in Calma ever lowers the volume of anything else.

---

## Sound manifest

Files live in `apps/native/assets/audio/`. Target format: **`.m4a`, AAC, 128kbps, 44.1kHz, mono**. Mono is fine at these lengths and halves the bundle. Every file is peak-normalised to **−3 dBFS** with a short fade-in and a natural fade-out — no clicks.

| Key | File | Length | Description |
|---|---|---|---|
| `sessionEnd` | `session-end.m4a` | 2–3s | Single soft strike of a low singing bowl. Warm round hum, slow natural decay, no harsh overtones. |
| `worryCaptured` | `worry-captured.m4a` | 0.5–1s | One small smooth pebble into still water. Soft clean low plop, subtle hollow resonance, contained. |
| `worryReleased` | `worry-released.m4a` | 1–1.5s | A handful of dry autumn leaves in a short gust. Light airy fluttering rustle, quick rise and settle. |
| `journalSaved` | `journal-saved.m4a` | 0.5–0.8s | A pencil stroke on textured paper, then a palm pressing flat. Soft whispery scratch, muted low thud. |
| `streakAchieved` | `streak-achieved.m4a` | 1.5–2s | Two soft glass notes struck in sequence, the second slightly higher, briefly overlapping. Pure, clear, warm, natural fade. |
| `panic` | `panic.m4a` | 1–1.5s | One deep thud of a soft mallet on a large low wooden drum. Round resonant boom, slow warm decay, fundamental 80–120 Hz. |
| `tierLimit` | `tier-limit.m4a` | 0.5–0.8s | A small brass bell tapped lightly with a fingertip. Clean soft ping, fast attack, short decay, emotionally neutral. |

### Delivered assets → target filenames

Seven generated `.mp3` files are present in `assets/audio/`. Rename and convert as follows.

| Delivered file | Rename to | Key |
|---|---|---|
| `Soft,_low-pitched_si_#3-1786277318909.mp3` | `session-end.m4a` | `sessionEnd` |
| `Tiny_pebble_plink_in_#2-1786277481299.mp3` | `worry-captured.m4a` | `worryCaptured` |
| `Crisp,_dry_rustle_of_#4-1786278055011.mp3` | `worry-released.m4a` | `worryReleased` |
| `Soft_whispery_pencil_#3-1786278247286.mp3` | `journal-saved.m4a` | `journalSaved` |
| `Two_soft_glass_notes_#2-1786278340228.mp3` | `streak-achieved.m4a` | `streakAchieved` |
| `A_single_small_brass_#2-1786278866176.mp3` | `tier-limit.m4a` | `tierLimit` |
| `Create_a_very_short__#1-1786276656069.mp3` | `panic.m4a` | `panic` ⚠️ |

⚠️ **The panic file is assigned by elimination, not by name.** Its truncated prompt ("Create a very short…") says nothing about its content. Listen to it before committing: it must be a deep wooden drum thud with a fundamental around 80–120 Hz. If it isn't, it needs regenerating — this is the single most important sound in the app and the only one a person hears at their worst moment.

### Why convert from mp3

MP3 encoding inserts encoder-delay padding at the start of every file — typically 20–50ms of silence that cannot be stripped without re-encoding. For `sessionEnd` that's inaudible. For `worryCaptured` (a 0.5s plop that must land the instant the text dissolves) and `panic` (which must fire on the same frame as the haptic), it reads as lag. AAC in an `.m4a` container carries proper gapless metadata.

```
ffmpeg -i "<source>.mp3" -af "afade=t=in:d=0.01,afade=t=out:st=<len-0.05>:d=0.05,loudnorm=I=-16:TP=-3" \
       -c:a aac -b:a 128k -ar 44100 -ac 1 <target>.m4a
```

Keep the source `.mp3` files out of the repo once converted (`systems/08-git-workflow.md`).

**Playback volumes** (relative, set per-key so nothing jumps out):

`panic` 1.0 · `sessionEnd` 0.9 · `streakAchieved` 0.8 · `worryReleased` 0.7 · `worryCaptured` 0.65 · `journalSaved` 0.6 · `tierLimit` 0.5

The tier-limit bell is the quietest sound in the app on purpose. Being told you've hit a limit should not feel like an alarm.

### Rules

- **No sound is ever played during an active breathing session** except `sessionEnd` at the very end.
- Never play two sounds simultaneously. A new sound cancels an in-flight one of the same key, and is skipped entirely if a longer-priority sound (`sessionEnd`, `panic`) is playing.
- `panic.m4a` fires on activation, then silence for the whole 60 seconds.
- All sounds are gated by `prefs.soundEnabled`. Audio failure is swallowed silently and never surfaced.

---

## Haptics

`expo-haptics`. Gated by `prefs.hapticsEnabled`. This is the primary guidance channel during breathing — someone should be able to close their eyes and follow the pulse in their hand.

### Vocabulary

| Moment | iOS | Android |
|---|---|---|
| Inhale begins | `impactAsync(Light)` | `impactAsync(Light)` |
| Hold begins | `selectionAsync()` | `impactAsync(Light)` |
| Exhale begins | `impactAsync(Medium)` | `impactAsync(Medium)` |
| Sigh — second inhale | `impactAsync(Light)` ×2, 140ms apart | same |
| Cycle complete | `selectionAsync()` | `impactAsync(Light)` |
| Session complete | `notificationAsync(Success)` | `notificationAsync(Success)` |
| Panic activation | `impactAsync(Heavy)` | `impactAsync(Heavy)` |
| Worry captured | `impactAsync(Light)` | `impactAsync(Light)` |
| Worry released | `impactAsync(Soft)` | `impactAsync(Light)` |
| Journal saved | `selectionAsync()` | `impactAsync(Light)` |
| Streak reached | `notificationAsync(Success)` | `notificationAsync(Success)` |
| Tier limit reached | `impactAsync(Soft)` | `impactAsync(Light)` |

**Never used:** `notificationAsync(Error)`, `notificationAsync(Warning)`, `impactAsync(Rigid)`. Nothing in Calma is an error and nothing should feel sharp.

### Android caveats (D-003)

`selectionAsync` maps to a very light click and is inconsistent across OEMs; the table above substitutes `Light` impact rather than relying on it. Haptic intensity is not controllable on many Android devices — verify on a mid-range Samsung and a Pixel, not just an emulator. Some devices disable app haptics when battery saver is on; we do not fight this, and the visual orb remains sufficient.

### Timing

Haptics fire from the Reanimated **worklet** at phase boundaries via `runOnJS`, not from a JS timer. A haptic that lags the orb by 100ms breaks the illusion that the two are the same thing. Budget: within 30ms of the visual transition.

---

## Walkthrough audio — removed

There is no voice track in Calma. See **D-012**.

The 90-second ElevenLabs walkthrough was cut when onboarding moved to a visual-first design. Voice is the largest per-language cost in the product, and a slightly-off warm voice in a mental-health app reads as uncanny rather than comforting.

**Removed with it:** `walkthrough.m4a`, `walkthrough.json`, subtitle rendering and cue timing, audio ducking, and `prefs.subtitlesEnabled`.

**What this leaves.** Calma ships **seven sounds and no speech**. Every one of them — a pebble, a bowl, leaves, a drum, a bell, glass notes, a pencil — is language-neutral. The audio design works in every locale with zero translation work. That is not a consolation; it's a better outcome than the voice track would have been.

Onboarding's warmth now lives in the handwritten founder note and the first-breath moment. See `systems/11-onboarding.md`.
