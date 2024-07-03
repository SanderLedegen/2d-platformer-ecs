export class Vec2 {
  static ZERO = new Vec2();

  constructor(public x = 0, public y = 0) {}

  public add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  public subtract(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  public multiply(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  public length(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  public normalize(): Vec2 {
    const length = this.length() || 1; // Prevent division by zero
    return new Vec2(this.x / length, this.y / length);
  }
}
