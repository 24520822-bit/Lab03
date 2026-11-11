import { describe, expect, it } from 'vitest';
import { createPianoKeys, midiToFrequency } from './notes';

describe('piano note model', () => {
  it('generates the complete A0–C8 range with 52 white and 36 black keys', () => {
    const keys = createPianoKeys();

    expect(keys).toHaveLength(88);
    expect(keys[0]).toMatchObject({ midi: 21, name: 'A0', isBlack: false });
    expect(keys[87]).toMatchObject({ midi: 108, name: 'C8', isBlack: false });
    expect(keys.map((key) => key.midi)).toEqual(
      Array.from({ length: 88 }, (_, index) => index + 21),
    );
    expect(keys.filter((key) => key.isBlack)).toHaveLength(36);
    expect(keys.filter((key) => !key.isBlack)).toHaveLength(52);
  });

  it('uses the equal-tempered frequency of A4 as the reference', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(21)).toBe(27.5);
    expect(midiToFrequency(108)).toBeCloseTo(4186.009, 3);
  });

  it('rejects MIDI values outside the 88-key range', () => {
    expect(() => midiToFrequency(20)).toThrow(RangeError);
    expect(() => midiToFrequency(109)).toThrow(RangeError);
  });
});
