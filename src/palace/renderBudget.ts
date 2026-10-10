/** Bounds rendering work independently of campaign time and input simulation. */
export type RenderState = {
  hidden: boolean;
  paused: boolean;
  animated: boolean;
  view: string;
};
export class PalaceRenderBudget {
  private lastFrame = -Infinity;
  private nextFrame = -Infinity;
  private lastHz = 0;
  private lastOverlay = -Infinity;
  private lastShadow = -Infinity;
  private lastView = '';
  private settleUntil = 0;
  private lastPaused = false;
  private quality = 1;
  private sampleStart = 0;
  private sampleFrames = 0;
  private fastWindows = 0;
  private readonly touch: boolean;
  private readonly software: boolean;
  constructor(touch: boolean, software = false) {this.touch = touch; this.software = software;}

  /** Full-speed interaction, 10 Hz frozen menus, and no hidden-tab scene work. */
  frame(now: number, state: RenderState): {overlay: boolean; shadow: boolean} | null {
    if (state.hidden) {
      this.lastFrame = -Infinity;
      this.nextFrame = -Infinity;
      this.sampleStart = 0;
      this.sampleFrames = 0;
      return null;
    }
    if (state.view !== this.lastView || state.paused !== this.lastPaused) {
      this.lastView = state.view;
      this.lastPaused = state.paused;
      this.settleUntil = now + 650;
      this.lastFrame = -Infinity;
      this.nextFrame = -Infinity;
    }
    const animated = !state.paused || state.animated || now < this.settleUntil;
    const hz = this.software ? 12 : animated ? 60 : 10;
    if (hz !== this.lastHz) {this.nextFrame = now; this.lastHz = hz;}
    if (now + .5 < this.nextFrame) return null;
    const interval = now - this.lastFrame;
    this.lastFrame = now;
    const period = 1000 / hz;
    this.nextFrame = Number.isFinite(this.nextFrame) && now - this.nextFrame < period ? this.nextFrame + period : now + period;
    if (!this.software && animated && interval < 250) this.sample(now);
    else {this.sampleStart = 0; this.sampleFrames = 0;}
    const overlay = now - this.lastOverlay >= 1000 / 20 - .5;
    const shadow = now - this.lastShadow >= 1000 / 30 - .5;
    if (overlay) this.lastOverlay = now;
    if (shadow) this.lastShadow = now;
    return {overlay, shadow};
  }

  private sample(now: number) {
    if (!this.sampleStart) {this.sampleStart = now; this.sampleFrames = 0; return;}
    this.sampleFrames++;
    const elapsed = now - this.sampleStart;
    if (elapsed < 2000) return;
    const fps = this.sampleFrames * 1000 / elapsed;
    if (fps < 42) {this.quality = Math.max(.75, this.quality - .1); this.fastWindows = 0;}
    else if (fps > 56) {
      this.fastWindows++;
      if (this.fastWindows >= 3) {this.quality = Math.min(1, this.quality + .05); this.fastWindows = 0;}
    } else this.fastWindows = 0;
    this.sampleStart = now;
    this.sampleFrames = 0;
  }

  /** Never change model/texture detail. Bound only the display framebuffer. */
  pixelRatio(width: number, height: number, devicePixelRatio: number): number {
    const device = Number.isFinite(devicePixelRatio) ? Math.max(.5, devicePixelRatio) : 1;
    const maxRatio = this.touch ? 1 : 1.5;
    const maxPixels = this.touch ? 1_600_000 : 3_000_000;
    const pixelLimit = Math.sqrt(maxPixels / Math.max(1, width * height));
    return Math.min(device, maxRatio, pixelLimit) * this.quality;
  }
}
