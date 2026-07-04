import type { VisualizerType } from './constants';

export interface VisualizerConfig {
  type: VisualizerType;
  thickness: number;
  speed: number;
  sensitivity: number;
  opacity: number;
  color: string;
  glow: boolean;
}

/**
 * Canvas renderer driven by a Web Audio `AnalyserNode`. Fully isolated from
 * playback logic (`controller.ts` owns the audio graph) so the visualizer
 * can be reused for a future streaming/Spotify source without change.
 */
export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode | null = null;
  private data: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private smoothed: Float32Array = new Float32Array(0);
  private rafId: number | null = null;
  private config: VisualizerConfig;

  constructor(canvas: HTMLCanvasElement, config: VisualizerConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.config = config;
  }

  attach(analyser: AnalyserNode): void {
    this.analyser = analyser;
    this.data = new Uint8Array(analyser.frequencyBinCount);
    this.smoothed = new Float32Array(analyser.frequencyBinCount);
  }

  updateConfig(config: Partial<VisualizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  start(): void {
    if (this.rafId !== null) return;
    const loop = () => {
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private draw(): void {
    const { ctx, canvas, config } = this;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.data);
    const smoothingFactor = Math.min(1, 0.35 * config.speed);
    for (let i = 0; i < this.data.length; i += 1) {
      const target = (this.data[i]! / 255) * config.sensitivity;
      this.smoothed[i] = (this.smoothed[i] ?? 0) + (target - (this.smoothed[i] ?? 0)) * smoothingFactor;
    }

    ctx.globalAlpha = config.opacity;
    ctx.fillStyle = config.color;
    ctx.strokeStyle = config.color;
    ctx.lineWidth = config.thickness;
    if (config.glow) {
      ctx.shadowColor = config.color;
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowBlur = 0;
    }

    if (config.type === 'bars') this.drawBars(width, height);
    else if (config.type === 'wave') this.drawWave(width, height);
    else if (config.type === 'line') this.drawLine(width, height);
    else if (config.type === 'dots') this.drawDots(width, height);
    else if (config.type === 'breathing') this.drawBreathing(width, height);
    else if (config.type === 'aura') this.drawAura(width, height);
    else this.drawCircular(width, height);

    ctx.globalAlpha = 1;
  }

  private sampleCount(bucketCount: number): number[] {
    const bucketed: number[] = [];
    const step = Math.floor(this.smoothed.length / bucketCount) || 1;
    for (let i = 0; i < bucketCount; i += 1) {
      let sum = 0;
      for (let j = 0; j < step; j += 1) sum += this.smoothed[i * step + j] ?? 0;
      bucketed.push(sum / step);
    }
    return bucketed;
  }

  private drawBars(width: number, height: number): void {
    const bucketCount = Math.max(8, Math.floor(width / (this.config.thickness * 3)));
    const values = this.sampleCount(bucketCount);
    const gap = width / bucketCount;
    values.forEach((value, index) => {
      const barHeight = Math.max(2, value * height);
      const x = index * gap + gap / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, height);
      this.ctx.lineTo(x, height - barHeight);
      this.ctx.stroke();
    });
  }

  private drawWave(width: number, height: number): void {
    const values = this.sampleCount(64);
    this.ctx.beginPath();
    values.forEach((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height / 2 - value * (height / 2 - this.config.thickness);
      if (index === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.stroke();
  }

  private drawLine(width: number, height: number): void {
    const values = this.sampleCount(96);
    this.ctx.lineWidth = Math.min(1.5, this.config.thickness * 0.5);
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    values.forEach((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height / 2 - value * (height / 2 - 2);
      if (index === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.stroke();
  }

  private drawDots(width: number, height: number): void {
    const bucketCount = Math.max(6, Math.floor(width / (this.config.thickness * 8)));
    const values = this.sampleCount(bucketCount);
    const gap = width / bucketCount;
    values.forEach((value, index) => {
      const x = index * gap + gap / 2;
      const radius = Math.max(1.5, this.config.thickness * 0.6 + value * this.config.thickness * 1.8);
      this.ctx.beginPath();
      this.ctx.arc(x, height / 2 - value * (height / 2 - radius), radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(x, height / 2 + value * (height / 2 - radius), radius * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  /** Wave shape with a slow sinusoidal amplitude envelope layered on top — a calmer, more organic read than a plain reactive wave. */
  private drawBreathing(width: number, height: number): void {
    const values = this.sampleCount(64);
    const envelope = 0.7 + 0.3 * Math.sin(performance.now() / 2200);
    this.ctx.beginPath();
    values.forEach((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height / 2 - value * envelope * (height / 2 - this.config.thickness);
      if (index === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.stroke();
  }

  /**
   * The signature visualizer — a soft glowing blob that swells with bass
   * energy, deliberately reusing the same radial-glow language as the
   * ambient cursor glow elsewhere in the app (see core/ambience) so the
   * whole product reads as one visual system rather than a collection of
   * independently-designed pieces.
   */
  private drawAura(width: number, height: number): void {
    const bassBinCount = Math.max(1, Math.floor(this.smoothed.length * 0.12));
    let bass = 0;
    for (let i = 0; i < bassBinCount; i += 1) bass += this.smoothed[i] ?? 0;
    bass /= bassBinCount;

    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.2;
    const radius = baseRadius + bass * Math.min(width, height) * 0.32;

    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, radius));
    gradient.addColorStop(0, this.config.color);
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawCircular(width: number, height: number): void {
    const values = this.sampleCount(48);
    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) / 2 - 10;
    this.ctx.beginPath();
    values.forEach((value, index) => {
      const angle = (index / values.length) * Math.PI * 2;
      const radius = baseRadius + value * (baseRadius * 0.6);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (index === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.closePath();
    this.ctx.stroke();
  }
}
