import { memo, Profiler, useCallback } from 'react';
import type { PianoNote } from './notes';
import { PianoKey } from './PianoKey';

const WHITE_KEY_COUNT = 52;
const BLACK_KEY_WIDTH = 0.65;

export interface PianoKeyboardProps {
  notes: readonly PianoNote[];
  pressedMidis: ReadonlySet<number>;
  onNoteStart(midi: number): void;
  onNoteEnd(midi: number): void;
  onProfileKeyRender?: (midi: number) => void;
}

interface PianoKeySlotProps {
  note: PianoNote;
  left: string;
  width: string;
  isPressed: boolean;
  onNoteStart(midi: number): void;
  onNoteEnd(midi: number): void;
  onProfileKeyRender?: (midi: number) => void;
}

const PianoKeySlot = memo(function PianoKeySlot({
  note,
  left,
  width,
  isPressed,
  onNoteStart,
  onNoteEnd,
  onProfileKeyRender,
}: PianoKeySlotProps) {
  const handleProfileRender = useCallback(
    (id: string) => {
      const midi = Number(id.slice('piano-key-'.length));
      if (Number.isInteger(midi)) onProfileKeyRender?.(midi);
    },
    [onProfileKeyRender],
  );
  const key = (
    <PianoKey
      midi={note.midi}
      label={note.name}
      isBlack={note.isBlack}
      isPressed={isPressed}
      onNoteStart={onNoteStart}
      onNoteEnd={onNoteEnd}
    />
  );

  return (
    <li
      className={`piano-key-slot ${note.isBlack ? 'piano-key-slot--black' : 'piano-key-slot--white'}`}
      style={{ left, width }}
    >
      {onProfileKeyRender ? (
        <Profiler id={`piano-key-${note.midi}`} onRender={handleProfileRender}>
          {key}
        </Profiler>
      ) : (
        key
      )}
    </li>
  );
});

export function PianoKeyboard({
  notes,
  pressedMidis,
  onNoteStart,
  onNoteEnd,
  onProfileKeyRender,
}: PianoKeyboardProps) {
  let whiteKeyIndex = 0;

  return (
    <section className="piano-viewport" aria-label="Piano keyboard">
      <ol className="piano-keyboard">
        {notes.map((note) => {
          const left = note.isBlack
            ? ((whiteKeyIndex - BLACK_KEY_WIDTH / 2) / WHITE_KEY_COUNT) * 100
            : (whiteKeyIndex / WHITE_KEY_COUNT) * 100;
          const width = (note.isBlack ? BLACK_KEY_WIDTH : 1) / WHITE_KEY_COUNT;
          if (!note.isBlack) whiteKeyIndex += 1;

          return (
            <PianoKeySlot
              key={note.midi}
              note={note}
              left={`${left}%`}
              width={`${width * 100}%`}
              isPressed={pressedMidis.has(note.midi)}
              onNoteStart={onNoteStart}
              onNoteEnd={onNoteEnd}
              onProfileKeyRender={onProfileKeyRender}
            />
          );
        })}
      </ol>
    </section>
  );
}
