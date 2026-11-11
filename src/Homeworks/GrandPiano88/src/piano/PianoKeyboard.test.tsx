import { act, useCallback, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPianoKeys } from './notes';
import { PianoKeyboard } from './PianoKeyboard';

const pianoKeys = createPianoKeys();

function KeyboardHarness({
  onProfileKeyRender,
}: {
  onProfileKeyRender: (midi: number) => void;
}) {
  const [pressedMidis, setPressedMidis] = useState<ReadonlySet<number>>(() => new Set());
  const onNoteStart = useCallback((midi: number) => {
    setPressedMidis((pressed) => new Set(pressed).add(midi));
  }, []);
  const onNoteEnd = useCallback((midi: number) => {
    setPressedMidis((pressed) => {
      const next = new Set(pressed);
      next.delete(midi);
      return next;
    });
  }, []);

  return (
    <PianoKeyboard
      notes={pianoKeys}
      pressedMidis={pressedMidis}
      onNoteStart={onNoteStart}
      onNoteEnd={onNoteEnd}
      onProfileKeyRender={onProfileKeyRender}
    />
  );
}

let root: Root | undefined;
let container: HTMLElement | undefined;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = undefined;
  container?.remove();
  container = undefined;
  vi.unstubAllGlobals();
});

async function mountKeyboard(onProfileKeyRender: (midi: number) => void): Promise<HTMLElement> {
  container = document.createElement('section');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<KeyboardHarness onProfileKeyRender={onProfileKeyRender} />);
  });
  return container;
}

describe('PianoKeyboard', () => {
  it('renders 88 accessible keys with the expected white and black key counts', async () => {
    const container = await mountKeyboard(vi.fn());
    const keys = Array.from(container.querySelectorAll<HTMLButtonElement>('.piano-key'));

    expect(keys).toHaveLength(88);
    expect(keys[0].getAttribute('aria-label')).toBe('A0');
    expect(keys[0].getAttribute('aria-pressed')).toBe('false');
    expect(keys.filter((key) => key.classList.contains('piano-key--black'))).toHaveLength(36);
    expect(keys.filter((key) => key.classList.contains('piano-key--white'))).toHaveLength(52);
    expect(container.querySelector('[data-midi="108"]')?.getAttribute('aria-label')).toBe('C8');
  });

  it('rerenders only the pressed key when one note changes state', async () => {
    const onProfileKeyRender = vi.fn();
    const container = await mountKeyboard(onProfileKeyRender);
    const c4 = container.querySelector<HTMLButtonElement>('[data-midi="60"]');
    expect(c4).not.toBeNull();
    onProfileKeyRender.mockClear();

    await act(async () => {
      c4?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    });

    expect(c4?.getAttribute('aria-pressed')).toBe('true');
    expect(onProfileKeyRender).toHaveBeenCalledTimes(1);
    expect(onProfileKeyRender).toHaveBeenCalledWith(60);
  });
});
