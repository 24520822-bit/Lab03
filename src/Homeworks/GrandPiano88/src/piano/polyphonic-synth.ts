import { midiToFrequency } from './notes';

const MAX_ACTIVE_VOICES = 8;
const RELEASE_START_DELAY_SECONDS = 0.04;
const RELEASE_TIME_CONSTANT_SECONDS = 0.025;
const RELEASE_STOP_DELAY_SECONDS = 0.19;
const PEAK_GAIN = 0.18;
const ATTACK_SECONDS = 0.02;
const MIN_GAIN = 0.0001;

interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
  releasing: boolean;
}

export class PolyphonicSynth {
  private readonly activeVoices = new Map<number, Voice>();

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
    if (existingVoice) this.releaseVoice(midi, existingVoice);

    if (this.activeVoices.size >= MAX_ACTIVE_VOICES) {
      const oldestMidi = this.activeVoices.keys().next().value;
      if (oldestMidi !== undefined) {
        const oldestVoice = this.activeVoices.get(oldestMidi);
        if (oldestVoice) this.releaseVoice(oldestMidi, oldestVoice);
      }
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    const voice: Voice = { oscillator, gain, releasing: false };

    oscillator.frequency.setValueAtTime(frequency ?? defaultFrequency, now);
    gain.gain.setValueAtTime(MIN_GAIN, now);
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, now + ATTACK_SECONDS);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    this.activeVoices.set(midi, voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      if (this.activeVoices.get(midi) === voice) this.activeVoices.delete(midi);
    };

    try {
      oscillator.start();
    } catch (error) {
      this.activeVoices.delete(midi);
      oscillator.onended = null;
      oscillator.disconnect();
      gain.disconnect();
      throw error;
    }
  }

  noteOff(midi: number): void {
    const voice = this.activeVoices.get(midi);
    if (voice) this.releaseVoice(midi, voice);
  }

  stopAll(): void {
    const voices = [...this.activeVoices.entries()];
    this.activeVoices.clear();
    for (const [midi, voice] of voices) this.releaseVoice(midi, voice);
  }

  private releaseVoice(midi: number, voice: Voice): void {
    if (voice.releasing) return;
    voice.releasing = true;
    if (this.activeVoices.get(midi) === voice) this.activeVoices.delete(midi);

    const releaseStart = this.context.currentTime + RELEASE_START_DELAY_SECONDS;
    voice.gain.gain.setTargetAtTime(
      MIN_GAIN,
      releaseStart,
      RELEASE_TIME_CONSTANT_SECONDS,
    );
    voice.oscillator.stop(this.context.currentTime + RELEASE_STOP_DELAY_SECONDS);
  }
}
