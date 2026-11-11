import { describe, expect, it, vi } from 'vitest';
import { PolyphonicSynth } from './polyphonic-synth';

function createAudioContextMock() {
  const oscillators: Array<{
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
  }> = [];
  const gains: Array<{
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
      setTargetAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const context = {
    currentTime: 2,
    destination: {},
    createOscillator: vi.fn(() => {
      const oscillator = {
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      };
      oscillators.push(oscillator);
      return oscillator;
    }),
    createGain: vi.fn(() => {
      const gain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      gains.push(gain);
      return gain;
    }),
  };

  return {
    context: context as unknown as AudioContext,
    oscillators,
    gains,
  };
}

describe('PolyphonicSynth', () => {
  it('starts a voice at its MIDI frequency', () => {
    const { context, oscillators, gains } = createAudioContextMock();
    const synth = new PolyphonicSynth(context);

    synth.noteOn(69);

    expect(oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(440, 2);
    expect(oscillators[0].connect).toHaveBeenCalledWith(gains[0]);
    expect(gains[0].connect).toHaveBeenCalledWith(context.destination);
    expect(oscillators[0].start).toHaveBeenCalledOnce();
    expect(synth.activeVoiceCount).toBe(1);
  });

  it('releases the oldest voice when a ninth note exceeds the voice limit', () => {
    const { context, oscillators, gains } = createAudioContextMock();
    const synth = new PolyphonicSynth(context);

    for (let midi = 60; midi < 68; midi += 1) synth.noteOn(midi);
    synth.noteOn(68);

    expect(synth.activeVoiceCount).toBe(8);
    expect(gains[0].gain.setTargetAtTime).toHaveBeenCalledWith(0.0001, 2.04, 0.025);
    expect(oscillators[0].stop).toHaveBeenCalledWith(2.19);
    expect(oscillators[8].start).toHaveBeenCalledOnce();
  });

  it('ramps a released voice down before stopping its oscillator', () => {
    const { context, oscillators, gains } = createAudioContextMock();
    const synth = new PolyphonicSynth(context);

    synth.noteOn(69, 442);
    synth.noteOff(69);

    expect(oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(442, 2);
    expect(gains[0].gain.setTargetAtTime).toHaveBeenCalledWith(0.0001, 2.04, 0.025);
    expect(oscillators[0].stop).toHaveBeenCalledWith(2.19);
    expect(synth.activeVoiceCount).toBe(0);
  });

  it('releases every active voice when stopped', () => {
    const { context, oscillators } = createAudioContextMock();
    const synth = new PolyphonicSynth(context);

    synth.noteOn(60);
    synth.noteOn(64);
    synth.stopAll();

    expect(synth.activeVoiceCount).toBe(0);
    expect(oscillators[0].stop).toHaveBeenCalledWith(2.19);
    expect(oscillators[1].stop).toHaveBeenCalledWith(2.19);
  });

  it('rejects invalid MIDI notes and frequencies before creating voices', () => {
    const { context } = createAudioContextMock();
    const synth = new PolyphonicSynth(context);

    expect(() => synth.noteOn(109)).toThrow(RangeError);
    expect(() => synth.noteOn(69, Number.NaN)).toThrow(RangeError);
    expect(synth.activeVoiceCount).toBe(0);
    expect(context.createOscillator).not.toHaveBeenCalled();
  });
});
