import { memo, type KeyboardEvent, type PointerEvent } from 'react';

export interface PianoKeyProps {
  midi: number;
  label: string;
  isBlack: boolean;
  isPressed: boolean;
  onNoteStart(midi: number): void;
  onNoteEnd(midi: number): void;
}

function PianoKeyView({
  midi,
  label,
  isBlack,
  isPressed,
  onNoteStart,
  onNoteEnd,
}: PianoKeyProps) {
  const startPointerNote = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    onNoteStart(midi);
  };
  const startKeyboardNote = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat) return;
    event.preventDefault();
    onNoteStart(midi);
  };
  const endKeyboardNote = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') onNoteEnd(midi);
  };

  return (
    <button
      type="button"
      className={`piano-key ${isBlack ? 'piano-key--black' : 'piano-key--white'}`}
      data-midi={midi}
      aria-label={label}
      aria-pressed={isPressed}
      onPointerDown={startPointerNote}
      onPointerUp={() => onNoteEnd(midi)}
      onPointerCancel={() => onNoteEnd(midi)}
      onPointerLeave={() => onNoteEnd(midi)}
      onKeyDown={startKeyboardNote}
      onKeyUp={endKeyboardNote}
      onBlur={() => onNoteEnd(midi)}
    >
      <span className="piano-key__label" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}

export const PianoKey = memo(PianoKeyView);
