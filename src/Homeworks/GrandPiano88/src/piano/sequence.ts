import { midiToFrequency } from './notes';

export interface RecordedNote {
  midi: number;
  freq: number;
  durationMs: number;
  deltaMs: number;
}

export type PlaybackSpeed = 0.5 | 1 | 2;

interface PendingNote {
  midi: number;
  freq: number;
  startedAt: number;
  deltaMs: number;
  durationMs?: number;
}

export interface SequenceSynth {
  noteOn(midi: number, frequency: number): void;
  noteOff(midi: number): void;
}

export class PianoSequenceRecorder {
  private recording = false;
  private readonly notes: PendingNote[] = [];
  private readonly pendingByMidi = new Map<number, PendingNote>();
  private lastOnsetAt: number | null = null;

  start(): void {
    this.recording = true;
    this.notes.length = 0;
    this.pendingByMidi.clear();
    this.lastOnsetAt = null;
  }

  noteOn(midi: number, freq: number, now = performance.now()): void {
    if (!this.recording || this.pendingByMidi.has(midi)) return;
    midiToFrequency(midi);
    if (!Number.isFinite(freq) || freq <= 0) {
      throw new RangeError('Frequency must be a positive finite number.');
    }

    const note: PendingNote = {
      midi,
      freq,
      startedAt: now,
      deltaMs: this.lastOnsetAt === null ? 0 : Math.max(0, now - this.lastOnsetAt),
    };
    this.notes.push(note);
    this.pendingByMidi.set(midi, note);
    this.lastOnsetAt = now;
  }

  noteOff(midi: number, now = performance.now()): void {
    if (!this.recording) return;
    const note = this.pendingByMidi.get(midi);
    if (!note) return;

    note.durationMs = Math.max(0, now - note.startedAt);
    this.pendingByMidi.delete(midi);
  }

  stop(now = performance.now()): void {
    if (!this.recording) return;
    for (const note of this.pendingByMidi.values()) {
      note.durationMs = Math.max(0, now - note.startedAt);
    }
    this.pendingByMidi.clear();
    this.recording = false;
  }

  getEvents(): readonly RecordedNote[] {
    return this.notes.flatMap((note) =>
      note.durationMs === undefined
        ? []
        : [
            {
              midi: note.midi,
              freq: note.freq,
              durationMs: note.durationMs,
              deltaMs: note.deltaMs,
            },
          ],
    );
  }
}

function createAbortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function abortableDelay(durationMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(createAbortError());

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, durationMs);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(createAbortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function scheduleNoteOff(
  midi: number,
  durationMs: number,
  synth: SequenceSynth,
  signal: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => finish(true), durationMs);
    const onAbort = () => finish(false);
    let settled = false;

    const finish = (release: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      if (release && !signal.aborted) {
        try {
          synth.noteOff(midi);
        } catch (error) {
          reject(error);
          return;
        }
      }
      resolve();
    };

    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) finish(false);
  });
}

export async function replaySequence(
  events: readonly RecordedNote[],
  speed: PlaybackSpeed,
  synth: SequenceSynth,
  signal: AbortSignal,
): Promise<void> {
  if (speed !== 0.5 && speed !== 1 && speed !== 2) {
    throw new RangeError('Playback speed must be 0.5, 1, or 2.');
  }
  if (signal.aborted) throw createAbortError();

  const pendingReleases: Promise<void>[] = [];
  for (const event of events) {
    if (
      !Number.isFinite(event.deltaMs) ||
      event.deltaMs < 0 ||
      !Number.isFinite(event.durationMs) ||
      event.durationMs < 0 ||
      !Number.isFinite(event.freq) ||
      event.freq <= 0
    ) {
      throw new RangeError('Recorded notes must contain valid timing and frequency values.');
    }

    await abortableDelay(event.deltaMs / speed, signal);
    if (signal.aborted) throw createAbortError();
    synth.noteOn(event.midi, event.freq);
    pendingReleases.push(scheduleNoteOff(event.midi, event.durationMs / speed, synth, signal));
  }

  await Promise.all(pendingReleases);
  if (signal.aborted) throw createAbortError();
}
