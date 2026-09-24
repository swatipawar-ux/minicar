/**
 * Procedural Web Audio System for Arcade Mini Racer 3D
 * Includes engine synthesis with simulated gearshifts, nitro blast, tire screech,
 * collision impact, collectibles chimes, near-miss whooshes, and an optional
 * synthesized 80s retro synthwave background track.
 */

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine audio nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Nitro audio nodes
  private nitroNoiseNode: AudioBufferSourceNode | null = null;
  private nitroGain: GainNode | null = null;
  private nitroSubOsc: OscillatorNode | null = null;
  private isNitroPlaying = false;

  // Tire screech audio nodes
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private isScreeching = false;

  // Music sequencer state
  private isMusicPlaying = false;
  private musicIntervalId: number | null = null;
  private musicStep = 0;

  // Settings
  public isMuted = false;
  public sfxVolume = 0.8;
  public musicVolume = 0.5;

  constructor() {
    // Lazy init on first user interaction
  }

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initEngineSynth();
      this.initNitroSynth();
      this.initDriftSynth();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private initEngineSynth() {
    if (!this.ctx || !this.sfxGain) return;

    // Dual oscillator engine generator
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineGain = this.ctx.createGain();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';

    // Slight detune for mechanical motor growl
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
    this.engineOsc2.frequency.setValueAtTime(45.6, this.ctx.currentTime);

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  private initNitroSynth() {
    if (!this.ctx || !this.sfxGain) return;

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.nitroGain.connect(this.sfxGain);
  }

  private initDriftSynth() {
    if (!this.ctx || !this.sfxGain) return;

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.sfxGain);

    // Continuous noise source for screech
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.connect(this.screechFilter);
    whiteNoise.start();
  }

  /**
   * Update dynamic engine pitch, volume, and simulated gear revs
   */
  public updateEngine(speedKmh: number, isThrottle: boolean, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    // Simulated 5-speed transmission gear ratios
    const gearRatios = [35, 75, 120, 160, 240];
    let currentGear = 0;
    for (let i = 0; i < gearRatios.length; i++) {
      if (speedKmh <= gearRatios[i]) {
        currentGear = i;
        break;
      }
    }
    const prevRatio = currentGear === 0 ? 0 : gearRatios[currentGear - 1];
    const gearProgress = Math.min(1, Math.max(0, (speedKmh - prevRatio) / (gearRatios[currentGear] - prevRatio)));

    // Dynamic pitch based on gear RPM
    const baseRpmPitch = 38 + gearProgress * 42 + (isBoosting ? 30 : 0) + (isThrottle ? 12 : 0);
    const filterCutoff = 220 + gearProgress * 650 + (isBoosting ? 500 : 0);
    const targetVolume = Math.min(0.28, 0.04 + (speedKmh / 600) + (isThrottle ? 0.05 : 0.01));

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(baseRpmPitch, now, 0.06);
    this.engineOsc2.frequency.setTargetAtTime(baseRpmPitch * 1.015, now, 0.06);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.06);
    this.engineGain.gain.setTargetAtTime(this.isMuted ? 0 : targetVolume, now, 0.08);

    // Nitro sound active
    if (isBoosting && !this.isNitroPlaying) {
      this.startNitroSound();
    } else if (!isBoosting && this.isNitroPlaying) {
      this.stopNitroSound();
    }
  }

  public setDrift(isDrifting: boolean, intensity = 1) {
    if (!this.ctx || !this.screechGain) return;
    const now = this.ctx.currentTime;
    if (isDrifting && !this.isMuted) {
      this.screechGain.gain.setTargetAtTime(0.07 * intensity, now, 0.04);
      this.isScreeching = true;
    } else if (this.isScreeching) {
      this.screechGain.gain.setTargetAtTime(0.0001, now, 0.08);
      this.isScreeching = false;
    }
  }

  private startNitroSound() {
    if (!this.ctx || !this.sfxGain) return;
    this.isNitroPlaying = true;

    try {
      // Create sub-bass roar
      this.nitroSubOsc = this.ctx.createOscillator();
      this.nitroSubOsc.type = 'sawtooth';
      this.nitroSubOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.nitroSubOsc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.4);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.nitroSubOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      this.nitroSubOsc.start();

      // White noise rocket hiss
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      this.nitroNoiseNode = this.ctx.createBufferSource();
      this.nitroNoiseNode.buffer = buffer;
      this.nitroNoiseNode.loop = true;

      const nitroFilter = this.ctx.createBiquadFilter();
      nitroFilter.type = 'bandpass';
      nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      nitroFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      this.nitroNoiseNode.connect(nitroFilter);
      nitroFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      this.nitroNoiseNode.start();
    } catch {
      // ignore
    }
  }

  private stopNitroSound() {
    this.isNitroPlaying = false;
    try {
      if (this.nitroNoiseNode) {
        this.nitroNoiseNode.stop();
        this.nitroNoiseNode.disconnect();
        this.nitroNoiseNode = null;
      }
      if (this.nitroSubOsc) {
        this.nitroSubOsc.stop();
        this.nitroSubOsc.disconnect();
        this.nitroSubOsc = null;
      }
    } catch {
      // ignore
    }
  }

  /**
   * Sound effect: Canister collected
   */
  public playNitroPickup() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A Major arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.2);
    });
  }

  /**
   * Sound effect: Coin or Point Crystal collected
   */
  public playCoinPickup() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Sound effect: Shield invulnerability pickup
   */
  public playShieldPickup() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * Sound effect: Near-miss whoosh
   */
  public playNearMiss() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  /**
   * Sound effect: Crash impact
   */
  public playCrash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sub thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // Noise explosion
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  /**
   * Synthesizer 80s Arcade Synthwave Background Music
   */
  public startSynthwaveMusic() {
    if (this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // Bassline in D minor (D1, D2, F1, G1, A1, C2)
    // 128 BPM = ~117ms per 16th note
    const stepDuration = 117; 
    const bassSequence = [
      73.42, 146.83, 73.42, 146.83, // D2 - D3
      73.42, 146.83, 87.31, 98.00,  // D - F - G
      73.42, 146.83, 73.42, 146.83, // D - D
      110.0, 98.00, 87.31, 65.41    // A - G - F - C
    ];

    const leadChords = [
      [293.66, 349.23, 440.0], // D minor
      [293.66, 349.23, 440.0],
      [261.63, 329.63, 392.0], // C major
      [220.00, 261.63, 329.63] // A minor
    ];

    this.musicIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;
      const bar = Math.floor((this.musicStep % 64) / 16);

      // 1. Synthwave 16th note rolling bassline
      const bassFreq = bassSequence[step];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(420, now);
      bassFilter.Q.setValueAtTime(3.0, now);

      bassGain.gain.setValueAtTime(0.09, now);
      bassGain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.11);

      // 2. Synth Chord stab on 4th and 12th 16th steps
      if (step === 4 || step === 12) {
        const chord = leadChords[bar];
        chord.forEach((freq) => {
          const chordOsc = this.ctx!.createOscillator();
          const chordGain = this.ctx!.createGain();
          const chordFilter = this.ctx!.createBiquadFilter();

          chordOsc.type = 'sawtooth';
          chordOsc.frequency.setValueAtTime(freq, now);

          chordFilter.type = 'lowpass';
          chordFilter.frequency.setValueAtTime(1600, now);
          chordFilter.frequency.exponentialRampToValueAtTime(600, now + 0.25);

          chordGain.gain.setValueAtTime(0.035, now);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          chordOsc.connect(chordFilter);
          chordFilter.connect(chordGain);
          chordGain.connect(this.musicGain!);

          chordOsc.start(now);
          chordOsc.stop(now + 0.3);
        });
      }

      // 3. Cyber hi-hat tick on every 8th note
      if (step % 2 === 0) {
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        hatOsc.type = 'sine';
        hatOsc.frequency.setValueAtTime(6000 + Math.random() * 2000, now);

        hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.02 : 0.01, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        hatOsc.connect(hatGain);
        hatGain.connect(this.musicGain);
        hatOsc.start(now);
        hatOsc.stop(now + 0.05);
      }

      this.musicStep++;
    }, stepDuration);
  }

  public stopSynthwaveMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopSynthwaveMusic();
      return false;
    } else {
      this.init();
      this.startSynthwaveMusic();
      return true;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = vol;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = vol;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public stopAll() {
    this.stopNitroSound();
    this.setDrift(false);
    this.stopSynthwaveMusic();
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    }
  }
}
