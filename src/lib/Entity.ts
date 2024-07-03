import {
  AnimationComponent,
  BoundingBoxComponent,
  GravityComponent,
  InputComponent,
  StateComponent,
  TransformComponent,
} from './Components';

interface Components {
  transform: TransformComponent;
  input: InputComponent;
  boundingBox: BoundingBoxComponent;
  gravity: GravityComponent;
  animation: AnimationComponent;
  state: StateComponent;
}

export class Entity {
  private components: Partial<Components>;
  private active = true;

  constructor(private id = 0, private tag: string) {
    this.components = {};
  }

  public isActive(): boolean {
    return this.active;
  }

  public getId(): number {
    return this.id;
  }

  public getTag(): string {
    return this.tag;
  }

  public destroy() {
    this.active = false;
  }

  public getComponent<T extends keyof Components>(type: T) {
    return this.components[type];
  }

  public setComponent<T extends keyof Components>(type: T, comp: Components[T]) {
    this.components[type] = comp;
  }
}
