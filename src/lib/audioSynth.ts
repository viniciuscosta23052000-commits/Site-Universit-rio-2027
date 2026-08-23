/**
 * Web Audio Ambient Sound Generator & Study Audio Manager
 * Generates pure browser-synthesized sounds (40Hz Gamma Focus, Rain, White/Brown Noise, Binaural Alpha waves, Lo-Fi Pulse)
 * without needing external audio downloads.
 */

export type SoundType = 'rain' | 'lofi' | 'whitenoise' | 'binaural' | 'none';
export type AmbientSoundType = SoundType | 'binaural40' | 'brown_noise' | 'cafe_ambient';

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private currentType: SoundType = 'none';
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): SoundType {
    return this.currentType;
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch (e) {}
      }
    });
    this.activeNodes = [];
    this.currentType = 'none';
  }

  public play(type: SoundType, customVolume?: number) {
    this.stop();
    if (type === 'none') return;

    if (customVolume !== undefined) {
      this.volume = customVolume;
    }

    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (type === 'binaural') {
      // 10Hz Alpha Focus: 200Hz in Left ear, 210Hz in Right ear
      const merger = this.ctx.createChannelMerger(2);

      const oscLeft = this.ctx.createOscillator();
      oscLeft.type = 'sine';
      oscLeft.frequency.value = 200;

      const oscRight = this.ctx.createOscillator();
      oscRight.type = 'sine';
      oscRight.frequency.value = 210;

      const gainL = this.ctx.createGain();
      gainL.gain.value = 0.25;
      const gainR = this.ctx.createGain();
      gainR.gain.value = 0.25;

      oscLeft.connect(gainL);
      gainL.connect(merger, 0, 0);

      oscRight.connect(gainR);
      gainR.connect(merger, 0, 1);

      merger.connect(this.gainNode);

      oscLeft.start();
      oscRight.start();

      this.activeNodes.push(oscLeft, oscRight, gainL, gainR, merger);
    } else if (type === 'lofi') {
      // Warm lo-fi harmonic drone
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.value = 110; // A2

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 165; // E3

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.gainNode);

      osc1.start();
      osc2.start();

      this.activeNodes.push(osc1, osc2, filter);
    } else if (type === 'rain' || type === 'whitenoise') {
      // Noise buffer generator
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Pink/Rain filter
          data[i] = (lastOut + 0.05 * white) / 1.05;
          lastOut = data[i];
          data[i] *= 2.8;
        } else {
          // White noise
          data[i] = white * 0.4;
        }
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 900;
      } else {
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
      }

      noiseSource.connect(filter);
      filter.connect(this.gainNode);
      noiseSource.start();

      this.activeNodes.push(noiseSource, filter);
    }
  }
}

export const audioSynth = new AudioSynthesizer();
export const FocusSynthService = audioSynth;
