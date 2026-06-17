// Web Audio API Procedural Synthesizer for Forest Sound Effects
class AudioSynthManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientInterval: number | null = null;

  constructor() {
    // Lazy initialize on first interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    } else if (!this.isMuted) {
      this.startForestAmbience();
    }
    return this.isMuted;
  }

  public getMuteStatus() {
    return this.isMuted;
  }

  // 1. Cute Mechanical Jump Sound
  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Smooth pitch sweep up-to-down for spring effect
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "triangle"; // Gives a lovely hollow soft feel
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 2. Delightful Gold Coin Ding Sound
  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Sweet two-tone chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(987.77, now); // B5 note
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6 note

    osc2.frequency.setValueAtTime(1975.54, now); // B6 note
    osc2.frequency.setValueAtTime(2637.02, now + 0.08); // E7 note for high shimmer

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // 3. Spiky Wood Collision sound (Computer crash/fizz)
  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Bass impact
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = "sawtooth";
    bassOsc.frequency.setValueAtTime(140, now);
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    
    bassGain.gain.setValueAtTime(0.25, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    bassOsc.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.35);

    // Crashing noise component
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to make it sound like a woody crash
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.25);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 0.25);
  }

  // 4. Start Soothing Forest Birds & Breeze Ambience
  public startForestAmbience() {
    if (this.isMuted) return;
    this.initContext();
    if (this.ambientInterval) return;

    // Periodically trigger a bird's chime or a breeze sweep
    this.ambientInterval = window.setInterval(() => {
      if (Math.random() > 0.4) {
        this.playBirdChime();
      } else {
        this.playBreezeSweep();
      }
    }, 4500) as unknown as number;

    // Trigger initial sound
    this.playBirdChime();
  }

  public stopForestAmbience() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  // Cute procedural soft forest bird
  private playBirdChime() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sine";
    const baseFreq = 1600 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, now);
    
    // Cute quick warble: pitch goes high, wobbles, fades
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 300, now + 0.05);
    osc.frequency.linearRampToValueAtTime(baseFreq - 100, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 400, now + 0.2);
    osc.frequency.linearRampToValueAtTime(baseFreq, now + 0.3);

    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.02, now + 0.05); // Very soft background chime
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Soft gust of wind
  private playBreezeSweep() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Creating low pass filtered white noise
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.linearRampToValueAtTime(320, now + 0.7);
    filter.frequency.linearRampToValueAtTime(150, now + 1.5);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.03, now + 0.6); // quiet
    gainNode.gain.linearRampToValueAtTime(0.0, now + 1.5);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 1.5);
  }
}

export const AudioSynth = new AudioSynthManager();
export default AudioSynth;
