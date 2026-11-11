import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PianoApp } from './PianoApp';

function createAudioContextMock() {
  const oscillators: Array<{
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
  }> = [];
  const context = {
    currentTime: 0,
    state: 'running' as AudioContextState,
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
    createGain: vi.fn(() => ({
      gain: {
        value: 0,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    resume: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  };

  return {
    context: context as unknown as AudioContext,
    oscillators,
  };
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
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function mountPiano(props: {
  createAudioContext: () => AudioContext;
  now: () => number;
}): Promise<HTMLElement> {
  container = document.createElement('main');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<PianoApp {...props} />);
  });
  return container;
}

function pressKey(container: HTMLElement, midi: number, eventType: 'pointerdown' | 'pointerup'): void {
  const key = container.querySelector(`[data-midi="${midi}"]`);
  if (!key) throw new Error(`Missing piano key ${midi}`);
  key.dispatchEvent(new MouseEvent(eventType, { bubbles: true, button: 0 }));
}

describe('PianoApp', () => {
  it('cancels replay and silences active voices when Stop is selected', async () => {
    vi.useFakeTimers();
    const audio = createAudioContextMock();
    let now = 0;
    const container = await mountPiano({
      createAudioContext: () => audio.context,
      now: () => now,
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="Record"]')?.click();
      pressKey(container, 60, 'pointerdown');
      now = 100;
      pressKey(container, 60, 'pointerup');
      now = 200;
      pressKey(container, 64, 'pointerdown');
      now = 250;
      pressKey(container, 64, 'pointerup');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="Stop"]')?.click();
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="Play recording"]')?.click();
      await vi.advanceTimersByTimeAsync(0);
    });

    const voicesBeforeStop = audio.oscillators.length;
    expect(voicesBeforeStop).toBeGreaterThan(2);
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="Stop"]')?.click();
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(audio.oscillators).toHaveLength(voicesBeforeStop);
    expect(audio.oscillators.at(-1)?.stop).toHaveBeenCalledOnce();
  });

  it('silences active voices and closes its audio context on unmount', async () => {
    const audio = createAudioContextMock();
    const container = await mountPiano({
      createAudioContext: () => audio.context,
      now: () => 0,
    });

    await act(async () => {
      pressKey(container, 60, 'pointerdown');
    });
    expect(audio.oscillators).toHaveLength(1);

    await act(async () => {
      root?.unmount();
    });
    root = undefined;

    expect(audio.oscillators[0].stop).toHaveBeenCalledOnce();
    expect(audio.context.close).toHaveBeenCalledOnce();
  });
});
