export interface PianoNote {
  midi: number;
  name: string;
  frequency: number;
  isBlack: boolean;
}

const MIDI_MIN = 21;
const MIDI_MAX = 108;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export function midiToFrequency(midi: number): number {
  if (!Number.isInteger(midi) || midi < MIDI_MIN || midi > MIDI_MAX) {
    throw new RangeError(`MIDI note must be an integer from ${MIDI_MIN} to ${MIDI_MAX}.`);
  }

  return 440 * 2 ** ((midi - 69) / 12);
}

export function createPianoKeys(): PianoNote[] {
  return Array.from({ length: MIDI_MAX - MIDI_MIN + 1 }, (_, index) => {
    const midi = MIDI_MIN + index;
    const pitchClass = midi % 12;

    return {
      midi,
      name: `${NOTE_NAMES[pitchClass]}${Math.floor(midi / 12) - 1}`,
      frequency: midiToFrequency(midi),
      isBlack: BLACK_PITCH_CLASSES.has(pitchClass),
    };
  });
}
