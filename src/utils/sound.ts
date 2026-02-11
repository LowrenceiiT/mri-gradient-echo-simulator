import { SoundMode, SoundTheme } from '../types';

export class SoundEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  humOsc: OscillatorNode | null = null;
  humGain: GainNode | null = null;

  isRunning = false;
  isMuted = true;
  mode: SoundMode = 'visual';
  theme: SoundTheme = 'mechanical';

  nextNoteTime = 0;
  timerID: number | undefined;

  tr = 100;
  te = 10;
  gzAmp = 1.0;
  gyAmp = 1.0;
  gxAmp = 1.0;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
      }
    }
  }

  start() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.isRunning = true;
    this.updateBackgroundHum();

    if (this.mode === 'realtime' || this.mode === 'all') {
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.scheduler();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = undefined;
    }
    this.stopBackgroundHum();
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute) {
      this.masterGain?.gain.setTargetAtTime(0, this.ctx?.currentTime || 0, 0.1);
    } else {
      this.masterGain?.gain.setTargetAtTime(1, this.ctx?.currentTime || 0, 0.1);
      if (this.isRunning && this.ctx?.state === 'suspended') this.ctx.resume();
    }
    this.updateBackgroundHum();
  }

  setMode(mode: SoundMode) {
    const prevMode = this.mode;
    this.mode = mode;

    this.updateBackgroundHum();

    if (mode === 'visual') {
      if (this.timerID) window.clearTimeout(this.timerID);
    } else if (this.isRunning && prevMode === 'visual') {
      this.nextNoteTime = (this.ctx?.currentTime || 0) + 0.1;
      this.scheduler();
    }
  }

  setTheme(theme: SoundTheme) {
    this.theme = theme;
  }

  setParams(tr: number, te: number) {
    this.tr = tr;
    this.te = te;
  }

  setAmplitudes(gz: number, gy: number, gx: number) {
    this.gzAmp = gz;
    this.gyAmp = gy;
    this.gxAmp = gx;
  }

  updateBackgroundHum() {
    if (!this.ctx || !this.masterGain) return;

    const shouldPlayHum = this.isRunning && !this.isMuted && this.mode === 'all';

    if (shouldPlayHum) {
      if (!this.humOsc) {
        this.humOsc = this.ctx.createOscillator();
        this.humGain = this.ctx.createGain();

        this.humOsc.type = 'sawtooth';
        this.humOsc.frequency.value = 50;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;

        this.humOsc.connect(filter);
        filter.connect(this.humGain);
        this.humGain.connect(this.masterGain);

        this.humOsc.start();
        this.humGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.humGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 1);
      }
    } else {
      this.stopBackgroundHum();
    }
  }

  stopBackgroundHum() {
    if (this.humGain && this.ctx) {
      this.humGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      setTimeout(() => {
        if (this.humOsc) {
          this.humOsc.stop();
          this.humOsc.disconnect();
          this.humOsc = null;
        }
        if (this.humGain) {
          this.humGain.disconnect();
          this.humGain = null;
        }
      }, 300);
    }
  }

  triggerRF() {
    if (this.mode === 'visual' && !this.isMuted && this.ctx) this.playRFSound(this.ctx.currentTime);
  }

  triggerGradient(type: 'phase' | 'slice', amp: number) {
    if (this.mode === 'visual' && !this.isMuted && this.ctx) this.playGradientSound(this.ctx.currentTime, type, amp);
  }

  triggerReadout(amp: number) {
    if (this.mode === 'visual' && !this.isMuted && this.ctx) this.playReadoutSound(this.ctx.currentTime, amp);
  }

  scheduler() {
    if (!this.isRunning || !this.ctx || (this.mode !== 'realtime' && this.mode !== 'all')) return;

    const lookahead = 0.1;

    while (this.ctx && this.nextNoteTime < this.ctx.currentTime + lookahead) {
      if (!this.isMuted) {
        this.playRFSound(this.nextNoteTime);
        this.playGradientSound(this.nextNoteTime, 'slice', this.gzAmp);
        if (this.te < this.tr - 2) this.playReadoutSound(this.nextNoteTime + this.te / 1000, this.gxAmp);
        this.playGradientSound(this.nextNoteTime + 0.01, 'phase', this.gyAmp);
      }

      const interval = Math.max(this.tr, 10) / 1000;
      this.nextNoteTime += interval;
    }

    this.timerID = window.setTimeout(() => this.scheduler(), 25);
  }

  playRFSound(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (this.theme === 'mechanical') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.05);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, time);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  playGradientSound(time: number, type: 'phase' | 'slice', amp: number) {
    if (!this.ctx || !this.masterGain || amp < 0.05) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.Q.value = 5;

    const volumeScale = Math.min(amp, 1.5);

    if (this.theme === 'mechanical') {
      const baseFreq = type === 'slice' ? 100 : 125;
      osc.frequency.setValueAtTime(baseFreq, time);
      filter.frequency.setValueAtTime(800, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.4 * volumeScale, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    } else {
      const baseFreq = type === 'slice' ? 200 : 250;
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq, time);
      filter.frequency.setValueAtTime(400, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15 * volumeScale, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  playReadoutSound(time: number, amp: number) {
    if (!this.ctx || !this.masterGain || amp < 0.05) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const volumeScale = Math.min(amp, 1.5);

    if (this.theme === 'mechanical') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, time);
      osc.frequency.linearRampToValueAtTime(900, time + 0.05);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2 * volumeScale, time + 0.01);
      gain.gain.linearRampToValueAtTime(0.2 * volumeScale, time + 0.04);
      gain.gain.linearRampToValueAtTime(0, time + 0.05);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1 * volumeScale, time + 0.01);
      gain.gain.linearRampToValueAtTime(0.1 * volumeScale, time + 0.04);
      gain.gain.linearRampToValueAtTime(0, time + 0.05);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }
}

export const soundEngine = new SoundEngine();
