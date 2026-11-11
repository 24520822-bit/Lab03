import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { midiToFrequency, createPianoKeys } from './notes';
import { PolyphonicSynth } from './polyphonic-synth';
import { PianoKeyboard } from './PianoKeyboard';
import {
  PianoSequenceRecorder,
  replaySequence,
  type PlaybackSpeed,
  type RecordedNote,
} from './sequence';

export interface PianoAppProps {
  createAudioContext?: () => AudioContext;
  now?: () => number;
}

const PIANO_KEYS = createPianoKeys();

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'Unknown audio error';
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string' &&
    error.name === 'AbortError'
  );
}

export function PianoApp({ createAudioContext, now }: PianoAppProps) {
  const [pressedMidis, setPressedMidis] = useState<ReadonlySet<number>>(() => new Set());
  const [events, setEvents] = useState<readonly RecordedNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [message, setMessage] = useState('Ready to play.');
  const pressedMidisRef = useRef(new Set<number>());
  const recordingRef = useRef(false);
  const recorderRef = useRef(new PianoSequenceRecorder());
  const synthRef = useRef<PolyphonicSynth | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const replayControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const readClock = useCallback(() => now?.() ?? performance.now(), [now]);

  const getSynth = useCallback((): PolyphonicSynth => {
    if (synthRef.current) return synthRef.current;
    if (!createAudioContext && typeof AudioContext === 'undefined') {
      throw new Error('This browser does not support the Web Audio API.');
    }

    const context = createAudioContext ? createAudioContext() : new AudioContext();
    audioContextRef.current = context;
    synthRef.current = new PolyphonicSynth(context);
    if (context.state === 'suspended') {
      void context.resume().catch((error: unknown) => {
        if (mountedRef.current) setMessage(`Audio could not start: ${getErrorMessage(error)}`);
      });
    }
    return synthRef.current;
  }, [createAudioContext]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      replayControllerRef.current?.abort();
      replayControllerRef.current = null;
      try {
        synthRef.current?.stopAll();
      } catch (error) {
        console.error('Could not stop piano voices during cleanup:', error);
      }
      const context = audioContextRef.current;
      if (context && context.state !== 'closed') {
        void context.close().catch((error: unknown) => {
          console.error('Could not close the piano audio context:', error);
        });
      }
    };
  }, []);

  const handleNoteStart = useCallback(
    (midi: number) => {
      if (pressedMidisRef.current.has(midi)) return;
      try {
        const frequency = midiToFrequency(midi);
        getSynth().noteOn(midi, frequency);
        if (recordingRef.current) recorderRef.current.noteOn(midi, frequency, readClock());
        const next = new Set(pressedMidisRef.current).add(midi);
        pressedMidisRef.current = next;
        setPressedMidis(next);
      } catch (error) {
        setMessage(`Could not play note: ${getErrorMessage(error)}`);
      }
    },
    [getSynth, readClock],
  );

  const handleNoteEnd = useCallback(
    (midi: number) => {
      if (!pressedMidisRef.current.has(midi)) return;
      if (recordingRef.current) {
        recorderRef.current.noteOff(midi, readClock());
        setEvents(recorderRef.current.getEvents());
      }
      synthRef.current?.noteOff(midi);
      const next = new Set(pressedMidisRef.current);
      next.delete(midi);
      pressedMidisRef.current = next;
      setPressedMidis(next);
    },
    [readClock],
  );

  const handleRecord = useCallback(() => {
    replayControllerRef.current?.abort();
    replayControllerRef.current = null;
    synthRef.current?.stopAll();
    pressedMidisRef.current = new Set();
    setPressedMidis(new Set());
    recorderRef.current.start();
    recordingRef.current = true;
    setEvents([]);
    setIsPlaying(false);
    setIsRecording(true);
    setMessage('Recording notes.');
  }, []);

  const handleStop = useCallback(() => {
    replayControllerRef.current?.abort();
    replayControllerRef.current = null;
    recorderRef.current.stop(readClock());
    const recordedEvents = recorderRef.current.getEvents();
    recordingRef.current = false;
    setIsRecording(false);
    setEvents(recordedEvents);
    setIsPlaying(false);
    pressedMidisRef.current = new Set();
    setPressedMidis(new Set());

    try {
      synthRef.current?.stopAll();
      setMessage(`Stopped. ${recordedEvents.length} notes saved.`);
    } catch (error) {
      setMessage(`Could not stop piano audio: ${getErrorMessage(error)}`);
    }
  }, [readClock]);

  const handlePlay = useCallback(() => {
    if (events.length === 0) {
      setMessage('Record a sequence before playing it.');
      return;
    }

    try {
      const controller = new AbortController();
      replayControllerRef.current = controller;
      setIsPlaying(true);
      setMessage('Playing recorded sequence.');
      void replaySequence(events, speed, getSynth(), controller.signal).then(
        () => {
          if (controller.signal.aborted) return;
          replayControllerRef.current = null;
          setIsPlaying(false);
          setMessage('Replay complete.');
        },
        (error: unknown) => {
          if (controller.signal.aborted || isAbortError(error)) return;
          replayControllerRef.current = null;
          setIsPlaying(false);
          try {
            synthRef.current?.stopAll();
          } catch (stopError) {
            setMessage(`Replay failed: ${getErrorMessage(error)}; stop failed: ${getErrorMessage(stopError)}`);
            return;
          }
          setMessage(`Replay failed: ${getErrorMessage(error)}`);
        },
      );
    } catch (error) {
      setIsPlaying(false);
      setMessage(`Could not play recording: ${getErrorMessage(error)}`);
    }
  }, [events, getSynth, speed]);

  const handleSpeedChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const selectedSpeed = Number(event.currentTarget.value);
    if (selectedSpeed === 0.5 || selectedSpeed === 1 || selectedSpeed === 2) {
      setSpeed(selectedSpeed);
    }
  }, []);

  return (
    <>
      <header className="piano-heading">
        <p className="eyebrow">88-KEY POLYPHONIC PIANO</p>
        <h2 id="piano-heading">Grand Piano 88</h2>
        <p className="piano-intro">Play A0–C8, record a phrase, and replay it at your chosen speed.</p>
      </header>

      <PianoKeyboard
        notes={PIANO_KEYS}
        pressedMidis={pressedMidis}
        onNoteStart={handleNoteStart}
        onNoteEnd={handleNoteEnd}
      />

      <fieldset className="piano-controls">
        <legend>Recording and playback</legend>
        <button
          className="primary-button"
          type="button"
          aria-label="Record"
          aria-pressed={isRecording}
          disabled={isRecording || isPlaying}
          onClick={handleRecord}
        >
          Record
        </button>
        <button
          className="secondary-button"
          type="button"
          aria-label="Stop"
          disabled={!isRecording && !isPlaying && pressedMidis.size === 0}
          onClick={handleStop}
        >
          Stop
        </button>
        <button
          className="play-button"
          type="button"
          aria-label="Play recording"
          disabled={events.length === 0 || isRecording || isPlaying}
          onClick={handlePlay}
        >
          Play recording
        </button>
        <label htmlFor="piano-playback-speed">Replay speed</label>
        <select
          id="piano-playback-speed"
          aria-label="Playback speed"
          value={speed}
          onChange={handleSpeedChange}
        >
          <option value="0.5">0.5×</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
        </select>
      </fieldset>

      <p className="message piano-message" role="status" aria-live="polite">
        {message}
      </p>
      <p className="piano-event-count" aria-live="polite">
        {events.length} recorded {events.length === 1 ? 'note' : 'notes'}
      </p>
    </>
  );
}
