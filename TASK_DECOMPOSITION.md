# GrandPiano88 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an 88-key polyphonic piano and FIFO recording/replay to the GrandPiano88 homework while preserving its existing audio-track queue and visualizer.

**Architecture:** Keep the existing Vite/TypeScript app and its URL-fetch/decode `AudioTaskQueue` intact. Add a MIDI note model, an 8-voice Web Audio synthesizer, a cancellable note-sequence recorder/player, then mount a React 19 piano UI into a dedicated semantic slot in the existing app. Memoized key components receive stable callbacks and a per-key pressed boolean.

**Tech Stack:** TypeScript 5.8, Vite 6, Vitest 5, React 19, React DOM 19, Web Audio API.

**Spec:** User-approved scope in this conversation and the two attached HW2 assignment images.

## Global Constraints

- Follow `project-rules.md`: use React 19 functional components, semantic HTML, accessible controls, responsive layouts, strict TypeScript, and avoid unnecessary `<div>` elements.
- Generate MIDI notes A0–C8 (MIDI 21–108), exactly 52 white keys and 36 black keys, using `440 * 2 ** ((midi - 69) / 12)`.
- Limit polyphony to 8 voices; when adding a ninth voice, release the oldest active voice in insertion/FIFO order.
- Record `{ midi, freq, durationMs, deltaMs }` and replay in FIFO order at 0.5×, 1×, or 2× speed.
- Stop and unmount must abort pending replay work and silence active oscillators.
- Preserve the existing URL `AudioTaskQueue`, track controls, and frequency visualizer; limit product-code changes to `src/Homeworks/GrandPiano88`.
- Keep React dependencies limited to what the memoized UI requires; run the existing test, typecheck, lint, and build scripts.
- Run all `npm` commands from `src/Homeworks/GrandPiano88`.

## Review Focus

- MIDI range boundaries: MIDI 21 and 108 are included; out-of-range values are rejected and never rendered. Pin in `notes.test.ts` and `polyphonic-synth.test.ts`.
- Voice saturation: the ninth note releases only the oldest voice while the active map stays at 8. Pin in `polyphonic-synth.test.ts`.
- Stopped or unmounted playback: abort during a delay produces no later note-on and leaves no scheduled release timers or active voices. Pin in `sequence.test.ts` and the UI cleanup test.
- Replay timing and speed: `deltaMs` and `durationMs` scale by the selected speed without serializing overlapping notes. Pin in `sequence.test.ts`.
- Render isolation: after one key press, only that key's memoized component renders again. Pin in `PianoKeyboard.test.tsx` using per-key React Profiler callbacks.

---

### Task 1: Add the Piano Note Model and Polyphonic Synth

**Files:**
- Create: `src/Homeworks/GrandPiano88/src/piano/notes.ts`
- Test: `src/Homeworks/GrandPiano88/src/piano/notes.test.ts`
- Create: `src/Homeworks/GrandPiano88/src/piano/polyphonic-synth.ts`
- Test: `src/Homeworks/GrandPiano88/src/piano/polyphonic-synth.test.ts`

**Interfaces:**
- Produce `PianoNote = { midi: number; name: string; frequency: number; isBlack: boolean }`.
- Produce `createPianoKeys(): PianoNote[]` for MIDI 21–108 inclusive and `midiToFrequency(midi: number): number`.
- Produce `PolyphonicSynth(context: AudioContext)` with `noteOn(midi: number, frequency?: number): void`, `noteOff(midi: number): void`, `stopAll(): void`, and read-only `activeVoiceCount: number`. Validate MIDI 21–108 and any supplied frequency; default frequency to `midiToFrequency(midi)`.
- Track active voices in an insertion-ordered `Map<number, Voice>` capped at 8. Release the oldest voice before adding a ninth; use a gain ramp before stopping each oscillator.

- [x] **Step 1: Write note-model tests** asserting 88 generated keys, 52 white keys, 36 black keys, endpoints MIDI 21/108, and 440 Hz at MIDI 69.
- [x] **Step 2: Run `npm test -- src/piano/notes.test.ts` and confirm the new tests fail because the module is missing.**
- [x] **Step 3: Implement `createPianoKeys` and `midiToFrequency` in `src/piano/notes.ts`.** Derive note names and black-key status from MIDI pitch classes; do not enumerate 88 key tags or frequency constants.
- [x] **Step 4: Run the note-model test and confirm it passes.**
- [x] **Step 5: Write synth tests** asserting oscillator/gain creation, a maximum of 8 active voices, FIFO stealing on note nine, release on `noteOff`/`stopAll`, and `setTargetAtTime(0.0001, …)` before oscillator stop.
- [x] **Step 6: Run `npm test -- src/piano/polyphonic-synth.test.ts` and confirm the new tests fail.**
- [x] **Step 7: Implement `PolyphonicSynth` in `src/piano/polyphonic-synth.ts`.** Use `Map` insertion order for oldest-voice selection and a valid three-argument `setTargetAtTime` call for click-free release.
- [x] **Step 8: Run both new test files and the existing audio tests.**
- [x] **Step 9: Commit** as `feat: add piano note model and polyphonic synth`.

### Task 2: Add FIFO Recording and Cancellable Variable-Speed Replay

**Files:**
- Create: `src/Homeworks/GrandPiano88/src/piano/sequence.ts`
- Test: `src/Homeworks/GrandPiano88/src/piano/sequence.test.ts`

**Interfaces:**
- Produce `RecordedNote = { midi: number; freq: number; durationMs: number; deltaMs: number }` and `PlaybackSpeed = 0.5 | 1 | 2`.
- Produce `PianoSequenceRecorder` with `start(): void`, `noteOn(midi: number, freq: number, now?: number): void`, `noteOff(midi: number, now?: number): void`, `stop(): void`, and `getEvents(): readonly RecordedNote[]`.
- Produce `replaySequence(events, speed, synth, signal): Promise<void>`, where `synth` provides `noteOn(midi, freq)` and `noteOff(midi)`. Replay waits `deltaMs / speed` between note-ons and releases each note after `durationMs / speed`; simultaneous notes may overlap. Resolve only after the final note's release completes.

- [x] **Step 1: Write recorder tests** for FIFO event order, first-event delta, onset-to-onset `deltaMs`, and note-on-to-note-off `durationMs`.
- [x] **Step 2: Run `npm test -- src/piano/sequence.test.ts` and confirm the new tests fail.**
- [x] **Step 3: Implement `PianoSequenceRecorder` in `src/piano/sequence.ts`.**
- [x] **Step 4: Write replay tests** for all three speeds, overlapping note durations, and abort while waiting (no subsequent note-on).
- [x] **Step 5: Run the replay tests and confirm they fail before implementation.**
- [x] **Step 6: Implement `replaySequence` with abort-aware waits and cleanup of scheduled note releases.** On abort, reject with an `AbortError`; the caller is responsible for `synth.stopAll()`.
- [x] **Step 7: Run `npm test -- src/piano/sequence.test.ts` and confirm all recorder/replay tests pass.**
- [x] **Step 8: Commit** as `feat: add FIFO piano recording and replay`.

### Task 3: Integrate the Memoized React Piano UI

**Files:**
- Modify: `src/Homeworks/GrandPiano88/package.json`
- Modify: `src/Homeworks/GrandPiano88/package-lock.json`
- Modify: `src/Homeworks/GrandPiano88/tsconfig.json`
- Modify: `src/Homeworks/GrandPiano88/src/app.ts` (add a semantic piano mount point; retain existing track and visualizer markup)
- Modify: `src/Homeworks/GrandPiano88/src/main.ts` (mount the React piano in that point)
- Modify: `src/Homeworks/GrandPiano88/src/style.css`
- Modify: `src/Homeworks/GrandPiano88/README.md`
- Create: `src/Homeworks/GrandPiano88/src/piano/PianoKey.tsx`
- Create: `src/Homeworks/GrandPiano88/src/piano/PianoKeyboard.tsx`
- Create: `src/Homeworks/GrandPiano88/src/piano/PianoApp.tsx`
- Create: `src/Homeworks/GrandPiano88/src/piano/PianoKeyboard.test.tsx`

**Interfaces:**
- `PianoKey` is `memo`-wrapped and receives a MIDI number, label, `isBlack`, `isPressed`, and stable note-start/note-end callbacks. The start callback records the `midiToFrequency` value and passes it to the synthesizer.
- `PianoKeyboard` receives generated `PianoNote[]`, pressed MIDI state, and shared note callbacks; each key receives only its own `isPressed` boolean, not the full pressed set. An optional `onProfileKeyRender(midi)` callback wraps each key in a React `Profiler` only for the render-isolation test; the app omits it.
- `PianoApp` owns synthesizer, recorder, and replay cancellation lifecycle. Stop and React effect cleanup abort replay and call `stopAll`.

- [ ] **Step 1: Add React 19, React DOM 19, and matching type packages to the nested package manifest; set TypeScript `jsx` to `react-jsx`.** Update the lockfile with the package manager after the manifest change.
- [ ] **Step 2: Write UI tests** asserting 88 buttons, correct white/black counts, accessible labels/pressed state, and per-key Profiler counts that change only for the pressed key.
- [ ] **Step 3: Run `npm test -- src/piano/PianoKeyboard.test.tsx` and confirm the new tests fail.**
- [ ] **Step 4: Implement `PianoKey` and `PianoKeyboard`.** Use stable callbacks and primitive per-key props so `React.memo` prevents unrelated keys from rendering again.
- [ ] **Step 5: Run the keyboard tests and confirm key generation and render isolation pass.**
- [ ] **Step 6: Implement `PianoApp` controls for recording, Stop, replay, and the 0.5×/1×/2× selector.** Connect pointer and keyboard press/release, record only live input, and prevent replay from being recorded again.
- [ ] **Step 7: Add the React mount point to `app.ts` and mount `PianoApp` from `main.ts` without removing the existing URL queue or visualizer.**
- [ ] **Step 8: Add responsive piano-key styling in the existing stylesheet and document the piano controls and replay behavior in `README.md`.**
- [ ] **Step 9: Run the full nested-project checks: `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.** Confirm the pre-existing queue/visualizer tests still pass.
- [ ] **Step 10: Commit** as `feat: integrate memoized React piano UI`.

## Proposed Commit Map

1. `feat: add piano note model and polyphonic synth` — Task 1.
2. `feat: add FIFO piano recording and replay` — Task 2.
3. `feat: integrate memoized React piano UI` — Task 3, including React dependencies, app integration, styles, and README.
