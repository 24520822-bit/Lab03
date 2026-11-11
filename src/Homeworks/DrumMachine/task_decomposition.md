# Production Studio Drum Kit Implementation Plan

> **For agentic workers:** Read this plan and the assignment criteria before implementation. Complete tasks in order; each task maps to one proposed commit.

**Goal:** Extend the existing drum kit to satisfy the selected physical-key, input-isolation, and Deaf/Hard-of-Hearing visual-feedback criteria while preserving its sounds and recording/playback.

**Architecture:** Keep the existing vanilla HTML/CSS and ES modules. Route keyboard, pad-button, and recording playback hits through one hit handler so audio, transient pad state, hit history, and visual meter stay in sync. The meter is visual feedback only; it does not measure or claim real decibels.

**Tech Stack:** HTML, CSS, browser JavaScript ES modules, existing `HTMLAudioElement` playback; no framework or new dependency.

**Spec:** User-provided assignment image and the approved scope in chat; no separate spec file.

> This project is intentionally kept as a plain Desktop folder, not a Git repository. The commit messages below are the requested proposed commit map; no actual commits are created.

## Global Constraints

- Preserve all nine existing sound files and their `data-key` / `data-sound` mappings.
- Preserve the project's nine physical-key mappings (`KeyA`, `KeyS`, `KeyD`, `KeyF`, `KeyG`, `KeyH`, `KeyJ`, `KeyK`, `KeyL`); use `KeyboardEvent.code`, ignore `event.repeat`, and do not hijack modifier shortcuts or typing in editable controls.
- Provide an accessible visual hit history with `aria-live="polite"`; keep the latest 10 hits visible as a bounded-history implementation choice.
- Animate a visual activity meter on every hit, but do not show numeric dB values or imply that it measures actual sound pressure.
- Preserve recording and playback behavior; playback must show the same visual feedback as live hits without recording itself again.
- Use native buttons and visible keyboard focus; aim for WCAG 2.2 AA and a Lighthouse score of 100 per the assignment.
- The repository currently has no declared test runner/build system; avoid adding dependencies solely for this work.

## Review Focus

- A held key must not generate repeated hits or leave a pad stuck active after focus loss: Task 2 verifies `event.repeat`, `keyup`, and window blur handling.
- Typing in `input`, `textarea`, `select`, or a contenteditable region must not play drums: Task 2 verifies each target.
- Modifier shortcuts and unrelated physical keys must remain unaffected: Task 2 verifies Ctrl/Meta/Alt and unmapped keys.
- Repeated fast hits must keep the pad feedback and hit history accurate: Tasks 3–5 verify retriggering and bounded history.
- Recording/playback must not omit hits, duplicate them, or record playback a second time: Task 6 verifies this end-to-end.

---

### Task 1: Make drum pads semantic, focusable controls

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Test: `tests/accessibility.test.js`

**Interfaces:**
- Consumes: Existing `.kit`, `.pad`, `data-key`, `data-sound`, `<kbd>`, and label markup.
- Produces: Each pad is a native `button type="button"` preserving its data attributes and accessible name; visible `:focus-visible` styling.

- [ ] Change each `.pad` wrapper to a native button, preserving its key/sound mapping and label.
- [ ] Reset browser button defaults so the existing grid and pad appearance remain consistent; add a clear focus indicator.
- [ ] Verify all nine pads are reachable by Tab and visibly focused; Enter/Space dispatch a native click without scrolling or submitting a form (sound handling is wired in Task 3).

**Commit:** `feat: make drum pads accessible buttons`

### Task 2: Harden physical-key handling and focus isolation

**Files:**
- Modify: `js/input.js`
- Test: `tests/input.test.js` plus browser keyboard/focus checks.

**Interfaces:**
- Consumes: The existing contract map and `bindKeyboard` input-validation behavior.
- Produces: `bindKeyboard({ isBound, onHit, onRelease })` handles `keydown` / `keyup` by `event.code`, releases held keys on window blur, and returns a cleanup function; invalid keydown events do not invoke `onHit`.

- [ ] Handle `keydown` and `keyup` by `event.code`; retain the `event.repeat` guard and ignore Ctrl/Meta/Alt shortcuts on keydown.
- [ ] Ignore drum-triggering keydown events from `input`, `textarea`, `select`, and editable content, plus IME composition events; release active keys on keyup and window blur.
- [ ] Verify the nine mapped codes (`KeyA`, `KeyS`, `KeyD`, `KeyF`, `KeyG`, `KeyH`, `KeyJ`, `KeyK`, `KeyL`) each invoke `onHit` once; a repeated keydown does not; keyup/blur invoke release; focus and shortcut cases invoke no hit.

**Commit:** `fix: isolate drum keyboard input`

### Task 3: Unify keyboard and pad activation

**Files:**
- Modify: `js/main.js`
- Create: `js/hit-controller.js`
- Modify: `js/contract.js` only if a shared pad-activation binding is needed.
- Test: `tests/hit-controller.test.js`

**Interfaces:**
- Consumes: Contract entries `{ el, sound }`, `engine.play(src)`, and `recorder.capture(code)`.
- Produces: `handleHit(code, { record = true, held = false } = {})` for keyboard, button, and replay hits; keyboard keydown calls it with `held: true`, and keyup releases that state. Audio, `.playing` / `aria-pressed`, and pulse-timer cleanup are consistent. Replay calls it with `record: false`.

- [ ] Route keyboard hits and native button `click` events through the shared handler; ensure one activation produces one hit.
- [ ] Keep `aria-pressed` and the visual active state synchronized: keyboard holds release on keyup/blur, while click/replay hits use a retriggerable short pulse.
- [ ] Verify mouse/touch and Enter/Space each play once; mapped keyboard keydown plays once and keyup releases the state without playing another sound.

**Commit:** `feat: unify drum pad hit handling`

### Task 4: Add an accessible hit history

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `style.css`
- Test: `tests/accessibility.test.js` and browser hit-log checks.

**Interfaces:**
- Consumes: The shared hit handler and pad labels/key codes.
- Produces: A visible `role="log"` / polite live region showing the latest 10 hits, each with a unique sequence number and pad/key label.

- [ ] Add a labelled history region with `aria-live="polite"` and additions announced without making the whole list atomic.
- [ ] Append one entry for each live hit, remove oldest entries beyond 10, and style the list to fit the existing page.
- [ ] Verify each input route adds one entry, the newest remains visible, and the list never exceeds 10 entries.

**Commit:** `feat: add accessible drum hit history`

### Task 5: Add hit-reactive visual meter feedback

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `style.css`
- Test: `tests/accessibility.test.js` and browser meter checks.

**Interfaces:**
- Consumes: The shared hit handler.
- Produces: A decorative meter/visualizer that reacts on every hit and is hidden from assistive technology when it conveys no information beyond the hit history.

- [ ] Add a labelled visual activity meter using CSS bars/segments; mark decorative animation `aria-hidden="true"` to avoid duplicate announcements.
- [ ] Trigger/retrigger a short visual pulse on every hit, including fast successive hits.
- [ ] Verify the meter reacts to every hit source; do not add real dB numbers or claim an acoustic measurement.

**Commit:** `feat: add visual drum activity meter`

### Task 6: Preserve recording/playback feedback and run acceptance checks

**Files:**
- Modify: `js/main.js`
- Modify: `js/recorder.js` only if needed to preserve the existing event-timing contract.
- Verify: `npm test` and browser recording/playback acceptance checks.

**Interfaces:**
- Consumes: `recorder.start()`, `stop()`, `capture(code)`, `play(trigger, onDone)`, and the shared hit handler.
- Produces: Recorded live keyboard/button hits replay with pad, log, and meter feedback; replayed events do not add to the recording.

- [ ] Ensure keyboard and button hits are captured while recording; replay scheduled events through the shared handler with recording disabled.
- [ ] Serve the project over HTTP from its root (for example `python -m http.server 8000`) and verify recording, stop, replay timing, UI feedback, and unchanged sound mappings in a browser.
- [ ] Run Lighthouse on the served page; address directly related accessibility findings and verify the assignment's WCAG 2.2 AA / Lighthouse target as far as the tool reports.

  Lighthouse is not available in the current environment; run it in a Lighthouse-enabled browser before treating the target score as verified.

**Commit:** `fix: preserve accessible feedback during playback`