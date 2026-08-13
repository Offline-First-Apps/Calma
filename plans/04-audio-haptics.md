# 04 — Audio & Haptics

Shared services. Built against placeholders so nothing blocks on asset delivery.

**Branch:** `feat/audio-haptics`
**Depends on:** 01
**Reference:** `systems/04-audio-and-haptics.md`

> **Assets delivered.** Seven generated `.mp3` files are already in `assets/audio/`. T02 renames and converts them. The placeholder approach is no longer needed — but see the ⚠️ on `panic.m4a`, which is assigned by elimination and must be verified by ear.

---

## T01 — Install expo-audio and configure the audio session

- [x] `1a29da6`
- **Commit:** `feat(audio): install expo-audio and configure audio session`
- **Touches:** `apps/native/package.json`, `apps/native/src/lib/audio/session.ts`
- **Done when:** `playsInSilentMode: false` and `interruptionMode: 'mixWithOthers'` are set at boot, and playing a sound over the user's music does not pause or duck it on either platform.

---

## T02 — Normalise and rename the delivered audio assets

- [x] `ca48882`
- **Commit:** `chore(audio): normalise and rename sound effect assets`
- **Touches:** `apps/native/assets/audio/*`
- **Done when:** all seven files are converted to AAC 128kbps mono `.m4a` using the ffmpeg command in the systems doc, renamed per the mapping table, peak-normalised to −3 dBFS, free of clicks, within their specified lengths, and the source `.mp3` files are deleted. Each file is listened to and confirmed to match its written description — **especially `panic.m4a`**, which must be a deep wooden drum with an 80–120 Hz fundamental. If it isn't, stop and flag it rather than shipping the wrong sound on the panic path.

- **Note (session 9): SIX OF SEVEN CONVERTED. `panic.m4a` DELIBERATELY NOT
  SHIPPED.** The file assigned to `panic` by elimination is not the sound the
  spec describes. Measured: fundamental ~31 Hz, 86% of its energy between 30
  and 60 Hz, only 1.9% in the specified 80-120 Hz band, and 90% of it below
  300 Hz -- which no phone speaker reproduces. On a laptop with a subwoofer it
  is a convincing drum; on the device it is meant for it is close to silence
  with a faint click in it. Per this todo's own instruction, stopped and
  flagged rather than shipped. `soundManifest.panic.module` is `null`, which
  `SoundBank` treats as a silent no-op, so nothing else is blocked. **It needs
  regenerating with a fundamental in the 80-120 Hz band before plan 07 can be
  called done.**
- **Note (session 9):** the ffmpeg command in `systems/04` uses
  `loudnorm=I=-16:TP=-3`, which normalises LOUDNESS, not peak -- it left the
  six files spread across -2.1 to -23.1 dBFS. The systems doc asks for peak
  normalisation to -3 dBFS, and the per-key relative volumes assume it;
  loudness-normalising and then applying those multipliers would correct
  twice. Converted with measured per-file gain instead, iterated against the
  DECODED AAC peak (the encoder moves it), landing all six within 0.15 dB of
  -3. Verified click-free at both ends. `systems/04` should be updated to
  match.

---

## T03 — Add the sound manifest

- [x] `85621ec`
- **Commit:** `feat(audio): add sound manifest`
- **Depends on:** T01, T02
- **Touches:** `apps/native/src/lib/audio/manifest.ts`
- **Done when:** all seven keys map to their bundled file with the relative volume from the systems doc, and a missing file fails at build time rather than silently at runtime.

---

## T04 — Build the SoundBank with preloading

- [x] `23809d3`
- **Commit:** `feat(audio): add sound bank with boot preloading`
- **Depends on:** T03
- **Touches:** `apps/native/src/lib/audio/SoundBank.ts`
- **Done when:** all sounds preload once at boot, `play(key)` has no first-play delay, playback failure is swallowed silently, and sounds are released on app teardown.

---

## T05 — Add playback arbitration rules

- [x] `23809d3`
- **Commit:** `feat(audio): add sound arbitration and priority rules`
- **Depends on:** T04
- **Touches:** `apps/native/src/lib/audio/SoundBank.ts`
- **Done when:** two sounds never overlap; a repeat of the same key cancels the in-flight one; a lower-priority sound is skipped while `sessionEnd` or `panic` is playing; nothing plays during an active breathing session except `sessionEnd`.

---

## T06 — Add the haptics service

- [x] `c81f12d`
- **Commit:** `feat(haptics): add haptics service with named vocabulary`
- **Touches:** `apps/native/src/lib/haptics/index.ts`
- **Done when:** every moment in the systems doc's vocabulary table is a named function with its platform-specific mapping; `Error`, `Warning`, and `Rigid` are not reachable from the public API.

---

## T07 — Gate audio and haptics on preferences

- [x] `a8415ea`
- **Commit:** `feat(audio): gate sound and haptics on user preferences`
- **Depends on:** T04, T06, `03-storage-layer` T06
- **Touches:** `apps/native/src/lib/audio/index.ts`, `apps/native/src/lib/haptics/index.ts`
- **Done when:** `soundEnabled` and `hapticsEnabled` are read from prefs and take effect immediately, with no re-render of the calling screen.

---

## T08 — Add worklet-safe haptic triggering

- [x] `3ee257b`
- **Commit:** `feat(haptics): add worklet-safe haptic triggering for breath phases`
- **Depends on:** T06
- **Touches:** `apps/native/src/lib/haptics/worklet.ts`
- **Done when:** haptics fire from a Reanimated worklet via `runOnJS` at animation phase boundaries, measured within 30ms of the visual transition on both platforms, and no JS-timer-driven path remains.

---

## T09 — Verify every sound in context

- [ ]
- **Commit:** `test(audio): verify sound playback in context on both platforms`
- **Depends on:** T05, T07
- **Touches:** plan notes
- **Done when:** every sound is heard in its real trigger context — not in isolation — through phone speaker, wired headphones, and Bluetooth, on iOS and Android. Specifically confirmed: `worryCaptured` lands on the same beat as the dissolve animation with no perceptible lag; `panic` fires simultaneously with the Heavy haptic; `tierLimit` is quiet enough that it does not read as an alarm; and nothing is audible during a breathing session except `sessionEnd`.

- **Note (session 9):** NOT DONE and cannot be -- it needs a device, speakers,
  headphones and ears. Left unticked. Everything T09 depends on is built.
