import { Animation } from './Animation';
import { Vec2 } from './Vec2';

export class TransformComponent {
  public prevPosition: Vec2;
  constructor(public position: Vec2, public velocity: Vec2) {
    this.prevPosition = new Vec2(position.x, position.y);
  }
}

export class InputComponent {
  public up = false;
  public left = false;
  public right = false;
  public canJump = true;
}

export class BoundingBoxComponent {
  public halfSize: Vec2;
  constructor(public size: Vec2) {
    this.halfSize = new Vec2(size.x / 2, size.y / 2);
  }
}

export class GravityComponent {
  constructor(public g = 0) {}
}

export class AnimationComponent {
  constructor(public anim: Animation, public width: number, public height: number) {}
}

export enum State {
  IDLE,
  RUN,
  JUMP,
}

export enum Direction {
  LEFT,
  RIGHT,
}

export class StateComponent {
  constructor(public state: State, public direction: Direction) {}
}
