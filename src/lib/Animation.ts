export class Animation {
  private counter = 0;
  private currAnimFrame = 0;
  private offscreenCanvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private frameWidth: number;

  constructor(
    private spriteSheet: HTMLImageElement,
    private numAnimFrames: number,
    private singleFrameDuration: number,
    public repeating = false
  ) {
    this.frameWidth = spriteSheet.width / numAnimFrames;

    this.offscreenCanvas = new OffscreenCanvas(this.frameWidth, spriteSheet.height);
    this.ctx = this.offscreenCanvas.getContext('2d')!;
    this.updateSprite();
  }

  public update(): void {
    this.counter += 1;
    this.currAnimFrame = Math.floor((this.counter / this.singleFrameDuration) % this.numAnimFrames);

    this.updateSprite();
  }

  public getSprite(): ImageBitmap {
    return this.offscreenCanvas.transferToImageBitmap();
  }

  public hasEnded(): boolean {
    return this.currAnimFrame === this.numAnimFrames - 1;
  }

  public duplicate(): Animation {
    return new Animation(this.spriteSheet, this.numAnimFrames, this.singleFrameDuration, this.repeating);
  }

  private updateSprite(): void {
    this.ctx.drawImage(
      this.spriteSheet,
      this.currAnimFrame * this.frameWidth,
      0,
      this.frameWidth,
      this.spriteSheet.height,
      0,
      0,
      this.offscreenCanvas.width,
      this.offscreenCanvas.height
    );
  }
}
