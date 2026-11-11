import { midiToFrequency } from './notes';

const MAX_VOICES = 8;
const RELEASE_START_DELAY_SECONDS = 0.04;
const RELEASE_TIME_CONSTANT_SECONDS = 0.025;
const RELEASE_STOP_DELAY_SECONDS = 0.19;
const STEAL_RELEASE_SECONDS = 0.02;
const STEAL_TIME_CONSTANT_SECONDS = 0.005;
const PEAK_GAIN = 0.18;
const ATTACK_SECONDS = 0.02;
const MIN_GAIN = 0.0001;

interface Voice {
  midi: number;
  oscillator: OscillatorNode;
  gain: GainNode;
  order: number;
  slot: number;
  startAt: number;
  stopAt: number | null;
  releasing: boolean;
}

export class PolyphonicSynth {
  private readonly activeVoices = new Map<number, Voice>();
  private readonly voiceSlots: Array<Voice | null> = Array.from(
    { length: MAX_VOICES },
    () => null,
  );
  private nextVoiceOrder = 0;

  constructor(private readonly context: AudioContext) {}

  get activeVoiceCount(): number {
    return this.activeVoices.size;
  }

  noteOn(midi: number, frequency?: number): void {
    const defaultFrequency = midiToFrequency(midi);
    if (frequency !== undefined && (!Number.isFinite(frequency) || frequency <= 0)) {
      throw new RangeError('Frequency must be a positive finite number.');
    }

    const existingVoice = this.activeVoices.get(midi);
    const slot = existingVoice
      ? existingVoice.slot
      : this.findAvailableSlot() ?? this.findOldestSlot();
    const previousVoice = this.voiceSlots[slot];
    let startAt = this.context.currentTime;
    if (previousVoice) {
      startAt = Math.max(startAt, this.releaseVoice(previousVoice, 'steal'));
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const voice: Voice = {
      midi,
      oscillator,
      gain,
      order: this.nextVoiceOrder++,
      slot,
      startAt,
      stopAt: null,
      releasing: false,
    };

    oscillator.frequency.setValueAtTime(frequency ?? defaultFrequency, startAt);
    gain.gain.setValueAtTime(MIN_GAIN, startAt);
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, startAt + ATTACK_SECONDS);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    this.activeVoices.set(midi, voice);
    this.voiceSlots[slot] = voice;
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      if (this.voiceSlots[slot] === voice) this.voiceSlots[slot] = null;
      if (this.activeVoices.get(midi) === voice) this.activeVoices.delete(midi);
    };

    try {
      oscillator.start(startAt);
    } catch (error) {
      this.activeVoices.delete(midi);
      if (this.voiceSlots[slot] === voice) this.voiceSlots[slot] = null;
      oscillator.onended = null;
      oscillator.disconnect();
      gain.disconnect();
      throw error;
    }
  }

  noteOff(midi: number): void {
    const voice = this.activeVoices.get(midi);
    if (voice) this.releaseVoice(voice, 'release');
  }

  stopAll(): void {
    const voices = this.voiceSlots.filter((voice): voice is Voice => voice !== null);
    this.activeVoices.clear();
    for (const voice of voices) this.releaseVoice(voice, 'steal');
  }

  private findAvailableSlot(): number | undefined {
    const availableSlot = this.voiceSlots.findIndex((voice) => voice === null);
    return availableSlot === -1 ? undefined : availableSlot;
  }

  private findOldestSlot(): number {
    let oldestSlot = 0;
    for (let slot = 1; slot < this.voiceSlots.length; slot += 1) {
      const current = this.voiceSlots[slot];
      const oldest = this.voiceSlots[oldestSlot];
      if (current && (!oldest || current.order < oldest.order)) oldestSlot = slot;
    }
    return oldestSlot;
  }

  private releaseVoice(voice: Voice, mode: 'release' | 'steal'): number {
    if (voice.releasing && mode === 'release') return voice.stopAt ?? voice.startAt;
    voice.releasing = true;
    if (this.activeVoices.get(voice.midi) === voice) this.activeVoices.delete(voice.midi);

    const now = this.context.currentTime;
    if (mode === 'steal') {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(
        voice.startAt > now ? MIN_GAIN : voice.gain.gain.value,
        now,
      );
    }
    const stopAt =
      voice.startAt > now
        ? voice.startAt
        : now +
          (mode === 'steal' ? STEAL_RELEASE_SECONDS : RELEASE_STOP_DELAY_SECONDS);
    voice.gain.gain.setTargetAtTime(
      MIN_GAIN,
      voice.startAt > now
        ? voice.startAt
        : now + (mode === 'steal' ? 0 : RELEASE_START_DELAY_SECONDS),
      mode === 'steal' ? STEAL_TIME_CONSTANT_SECONDS : RELEASE_TIME_CONSTANT_SECONDS,
    );
    voice.oscillator.stop(stopAt);
    voice.stopAt = stopAt;
    return stopAt;
  }
}
