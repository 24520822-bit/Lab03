import { afterEach, describe, expect, it, vi } from 'vitest';
import { PianoSequenceRecorder, replaySequence, type RecordedNote } from './sequence';

afterEach(() => {
  vi.useRealTimers();
});

describe('PianoSequenceRecorder', () => {
  it('keeps note-on FIFO order and records inter-onset and held durations', () => {
    const recorder = new PianoSequenceRecorder();
    recorder.start();
    recorder.noteOn(60, 261.63, 100);
    recorder.noteOn(64, 329.63, 150);
    recorder.noteOff(64, 190);
    recorder.noteOff(60, 220);
    recorder.stop(220);

    expect(recorder.getEvents()).toEqual([
      { midi: 60, freq: 261.63, durationMs: 120, deltaMs: 0 },
      { midi: 64, freq: 329.63, durationMs: 40, deltaMs: 50 },
    ]);
  });

  it('closes held notes when recording stops and resets the next take', () => {
    const recorder = new PianoSequenceRecorder();
    recorder.start();
    recorder.noteOn(69, 440, 10);
    recorder.stop(90);

    expect(recorder.getEvents()).toEqual([
      { midi: 69, freq: 440, durationMs: 80, deltaMs: 0 },
    ]);

    recorder.start();
    recorder.noteOn(72, 523.25, 200);
    recorder.noteOff(72, 250);
    recorder.stop(250);

    expect(recorder.getEvents()).toEqual([
      { midi: 72, freq: 523.25, durationMs: 50, deltaMs: 0 },
    ]);
  });
});

describe('replaySequence', () => {
  it.each([
    { speed: 0.5 as const, onsetMs: 160, durationMs: 200 },
    { speed: 1 as const, onsetMs: 80, durationMs: 100 },
    { speed: 2 as const, onsetMs: 40, durationMs: 50 },
  ])('scales note timing at $speed× speed', async ({ speed, onsetMs, durationMs }) => {
    vi.useFakeTimers();
    const synth = { noteOn: vi.fn(), noteOff: vi.fn() };
    const replay = replaySequence(
      [{ midi: 60, freq: 261.63, durationMs: 100, deltaMs: 80 }],
      speed,
      synth,
      new AbortController().signal,
    );

    await vi.advanceTimersByTimeAsync(onsetMs - 1);
    expect(synth.noteOn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(synth.noteOn).toHaveBeenCalledWith(60, 261.63);
    await vi.advanceTimersByTimeAsync(durationMs - 1);
    expect(synth.noteOff).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await replay;
    expect(synth.noteOff).toHaveBeenCalledWith(60);
  });

  it('scales onset offsets and durations while allowing notes to overlap', async () => {
    vi.useFakeTimers();
    const events: RecordedNote[] = [
      { midi: 60, freq: 261.63, durationMs: 100, deltaMs: 0 },
      { midi: 64, freq: 329.63, durationMs: 200, deltaMs: 100 },
    ];
    const synth = { noteOn: vi.fn(), noteOff: vi.fn() };
    const replay = replaySequence(events, 2, synth, new AbortController().signal);

    await vi.advanceTimersByTimeAsync(0);
    expect(synth.noteOn).toHaveBeenNthCalledWith(1, 60, 261.63);
    expect(synth.noteOn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(50);
    expect(synth.noteOff).toHaveBeenCalledWith(60);
    expect(synth.noteOn).toHaveBeenNthCalledWith(2, 64, 329.63);
    expect(synth.noteOff).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(99);
    expect(synth.noteOff).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await replay;

    expect(synth.noteOff).toHaveBeenNthCalledWith(2, 64);
  });

  it('rejects on abort and never starts a later note', async () => {
    vi.useFakeTimers();
    const events: RecordedNote[] = [
      { midi: 60, freq: 261.63, durationMs: 100, deltaMs: 0 },
      { midi: 64, freq: 329.63, durationMs: 100, deltaMs: 500 },
    ];
    const synth = { noteOn: vi.fn(), noteOff: vi.fn() };
    const controller = new AbortController();
    const replay = replaySequence(events, 1, synth, controller.signal);

    await vi.advanceTimersByTimeAsync(0);
    controller.abort();

    await expect(replay).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(1000);
    expect(synth.noteOn).toHaveBeenCalledTimes(1);
    expect(synth.noteOff).not.toHaveBeenCalled();
  });
});
