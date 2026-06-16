// /home/moumene/bem/frontend/components/ui/SynthesizedAudio.ts

export class SynthesizedAudioEngine {
  private ctx: AudioContext | null = null;

  // Wave ambient nodes
  private waveGain: GainNode | null = null;
  private waveFilter: BiquadFilterNode | null = null;
  private waveSource: AudioBufferSourceNode | null = null;
  private waveLfo: OscillatorNode | null = null;

  // Music sequencer nodes
  private musicGain: GainNode | null = null;
  private schedulerInterval: any = null;
  private isMusicPlaying: boolean = false;
  private tempo: number = 124; // Beats per minute
  private currentStep: number = 0;
  private nextNoteTime: number = 0.0;
  private scheduleAheadTime: number = 0.1; // How far ahead to schedule audio (seconds)
  private lookahead: number = 25.0; // How frequently to call scheduler (ms)

  // Master volume node
  private masterGain: GainNode | null = null;
  private isWavesPlaying: boolean = false;

  // Melody pattern (notes in midi/frequencies or scales)
  // Algerian celebration style pentatonic minor scale: D, F, G, A, C
  private scale = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00];
  private melodyPattern = [
    4, -1, 5, 4, -1, 6, 5, -1,
    7, 6, 5, 4, 3, -1, 4, -1,
  ]; // Indices of scale, -1 means rest

  constructor() {}

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public setMasterVolume(volume: number) {
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.ctx.currentTime + 0.1
      );
    }
  }

  // --- OCEAN WAVES GENERATOR ---
  public startWaves() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isWavesPlaying) return;

    try {
      // 1. Create a white noise buffer
      const bufferSize = this.ctx.sampleRate * 4; // 4 seconds of noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // 2. Setup nodes
      this.waveSource = this.ctx.createBufferSource();
      this.waveSource.buffer = buffer;
      this.waveSource.loop = true;

      this.waveFilter = this.ctx.createBiquadFilter();
      this.waveFilter.type = "lowpass";
      this.waveFilter.Q.setValueAtTime(1, this.ctx.currentTime);

      this.waveGain = this.ctx.createGain();
      this.waveGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      // 3. Modulate filter frequency with an LFO for crashing wave effect (0.12 Hz - about 8s cycle)
      this.waveLfo = this.ctx.createOscillator();
      this.waveLfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(400, this.ctx.currentTime); // sweep filter +- 400Hz

      this.waveFilter.frequency.setValueAtTime(500, this.ctx.currentTime); // Base filter frequency

      // Connect Lfo to sweep filter frequency
      this.waveLfo.connect(lfoGain);
      lfoGain.connect(this.waveFilter.frequency);

      // Connections: source -> filter -> gain -> master
      this.waveSource.connect(this.waveFilter);
      this.waveFilter.connect(this.waveGain);
      this.waveGain.connect(this.masterGain);

      // Start
      this.waveLfo.start();
      this.waveSource.start();
      this.isWavesPlaying = true;
    } catch (e) {
      console.error("Failed to start procedural waves:", e);
    }
  }

  public stopWaves() {
    if (this.waveSource) {
      try { this.waveSource.stop(); } catch (e) {}
      this.waveSource.disconnect();
      this.waveSource = null;
    }
    if (this.waveLfo) {
      try { this.waveLfo.stop(); } catch (e) {}
      this.waveLfo.disconnect();
      this.waveLfo = null;
    }
    if (this.waveFilter) {
      this.waveFilter.disconnect();
      this.waveFilter = null;
    }
    if (this.waveGain) {
      this.waveGain.disconnect();
      this.waveGain = null;
    }
    this.isWavesPlaying = false;
  }

  // --- PROCEDURAL PARTY MUSIC SEQUENCER ---
  public startMusic() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMusicPlaying) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime); // Lower synth track to blend nicely
    this.musicGain.connect(this.masterGain);

    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime;

    // Start scheduler loop
    this.schedulerInterval = setInterval(() => {
      this.scheduler();
    }, this.lookahead);
  }

  public stopMusic() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    if (this.musicGain) {
      this.musicGain.disconnect();
      this.musicGain = null;
    }
    this.isMusicPlaying = false;
  }

  private scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.tempo;
    const stepDuration = secondsPerBeat / 4; // 16th notes
    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleNote(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // --- Kick Drum (Every beat: 0, 4, 8, 12) ---
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

      gain.gain.setValueAtTime(1.0, time);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.18);

      osc.start(time);
      osc.stop(time + 0.2);
    }

    // --- Synthesized Hi-Hat (Off beats: 2, 6, 10, 14) ---
    if (step % 4 === 2) {
      // Noise burst for hi-hat
      const bufferSize = this.ctx.sampleRate * 0.05; // 50ms burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(7000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      source.start(time);
      source.stop(time + 0.05);
    }

    // --- Synthesizer Lead Melody ---
    const scaleIndex = this.melodyPattern[step];
    if (scaleIndex !== -1) {
      const freq = this.scale[scaleIndex];
      
      // Dual oscillator synth (Square + Triangle for retro digital party vibe)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const synthGain = this.ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq, time);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 1.005, time); // detuned slightly

      synthGain.gain.setValueAtTime(0.12, time);
      synthGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.exponentialRampToValueAtTime(300, time + 0.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(synthGain);
      synthGain.connect(this.musicGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.3);
      osc2.stop(time + 0.3);
    }
  }

  // --- PROCEDURAL WEDDING ULULATION (Zgharit) ---
  public playZgharit(volumeScale: number = 1.0) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const time = this.ctx.currentTime;
    
    // Create nodes
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gainNode = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, time);
    // Rapid pitch sweep upwards and downwards to simulate human voice ululation sweep
    osc.frequency.exponentialRampToValueAtTime(1300, time + 1.2);
    osc.frequency.exponentialRampToValueAtTime(750, time + 2.0);

    lfo.type = "sine";
    lfo.frequency.setValueAtTime(18, time); // 18 Hz trill speed

    lfoGain.gain.setValueAtTime(180, time); // Pitch modulation range (+- 180 Hz)

    // Volume envelope
    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(0.35 * volumeScale, time + 0.15); // Fade in
    gainNode.gain.setValueAtTime(0.35 * volumeScale, time + 1.8);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 2.2); // Fade out

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Start & Stop
    lfo.start(time);
    osc.start(time);

    lfo.stop(time + 2.2);
    osc.stop(time + 2.2);
  }

  // --- PROCEDURAL STAR COLLECT PING CHIME ---
  public playStarPing() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const time = this.ctx.currentTime;

    // Dual oscillator chime (sine + triangle for a shiny retro sound)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, time); // D5 note
    osc1.frequency.exponentialRampToValueAtTime(1174.66, time + 0.08); // Arpeggiates up to D6
    osc1.frequency.exponentialRampToValueAtTime(1567.98, time + 0.15); // Arpeggiates up to G6

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1174.66, time); // D6 note
    osc2.frequency.exponentialRampToValueAtTime(1760.00, time + 0.1); // Arpeggiates up to A6

    gainNode.gain.setValueAtTime(0.25, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.4); // Clean quick decay

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);

    osc1.stop(time + 0.4);
    osc2.stop(time + 0.4);
  }

  // Cleanup helper
  public destroy() {
    this.stopWaves();
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Global engine singleton
let engineInstance: SynthesizedAudioEngine | null = null;

export const getAudioEngine = (): SynthesizedAudioEngine => {
  if (typeof window === "undefined") {
    return {} as any;
  }
  if (!engineInstance) {
    engineInstance = new SynthesizedAudioEngine();
  }
  return engineInstance;
};
