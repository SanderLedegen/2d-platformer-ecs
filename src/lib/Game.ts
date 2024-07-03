import config from '../config.json';
import { Animation } from './Animation';
import {
  AnimationComponent,
  BoundingBoxComponent,
  Direction,
  GravityComponent,
  InputComponent,
  State,
  StateComponent,
  TransformComponent,
} from './Components';
import { Entity } from './Entity';
import { EntityManager } from './EntityManager';
import { Vec2 } from './Vec2';
import { Level } from './types';
import { calcOverlap } from './utils';

export class Game {
  private readonly internalWidth = config.game.internalWidth;
  private readonly internalHeight = config.game.internalHeight;

  private paused = false;
  private entityManager!: EntityManager;
  private player!: Entity;
  private drawBoundingBoxes = false;
  private drawTextures = true;
  private drawGrid = false;

  constructor(
    private context: CanvasRenderingContext2D,
    private animations: Map<string, Animation>,
    private level: Level
  ) {
    this.run = this.run.bind(this);
    this.init();
  }

  public run(time = 0): void {
    // TODO: Handle different monitor refresh rates by taking `time` into account
    if (!this.paused) {
      this.entityManager.update();
      this.handleMovement();
      this.checkCollision();
    }

    this.handleAnimations();
    this.render();

    requestAnimationFrame(this.run);
  }

  public handleInput(e: KeyboardEvent): void {
    const inputComp = this.player.getComponent('input');
    if (!inputComp) return;

    switch (e.key) {
      case 'a':
        inputComp.left = e.type === 'keydown';
        break;
      case 'd':
        inputComp.right = e.type === 'keydown';
        break;
      case 'w':
        inputComp.up = e.type === 'keydown';
        break;
      case 'r':
        this.init();
        break;
      case 'g':
        if (e.type === 'keydown') {
          this.drawGrid = !this.drawGrid;
        }
        break;
      case 'b':
        if (e.type === 'keydown') {
          this.drawBoundingBoxes = !this.drawBoundingBoxes;
        }
        break;
      case 't':
        if (e.type === 'keydown') {
          this.drawTextures = !this.drawTextures;
        }
        break;
      case 'Escape':
        if (e.type === 'keydown') {
          this.paused = !this.paused;
        }
        break;
    }
  }

  private init(): void {
    this.entityManager = new EntityManager();
    this.loadLevel(this.level);
  }

  private loadLevel(level: Level): void {
    // TODO: Is this okay? Ignoring other sizes/widths/heights defined elsewhere?
    const tileSize = config.game.tileSize;

    this.player = this.entityManager.addEntity('player');
    const transformComp = new TransformComponent(
      new Vec2(
        level.player.startX * tileSize,
        (config.game.gameHeight - 1 - level.player.startY) * tileSize
      ),
      Vec2.ZERO
    );
    this.player.setComponent('transform', transformComp);

    const inputComp = new InputComponent();
    this.player.setComponent('input', inputComp);
    this.player.setComponent('gravity', new GravityComponent(config.game.gravity));
    const playerAnim = this.animations.get('playerIdle')!;
    this.player.setComponent(
      'animation',
      new AnimationComponent(playerAnim, config.player.width, config.player.height)
    );
    this.player.setComponent(
      'boundingBox',
      new BoundingBoxComponent(
        new Vec2(config.player.boundingBox.width, config.player.boundingBox.height)
      )
    );
    this.player.setComponent('state', new StateComponent(State.IDLE, Direction.RIGHT));

    for (const { tag, animation, data } of level.level) {
      for (const [x, y] of data) {
        const entity = this.entityManager.addEntity(tag);
        // TODO: Check this, something like config['solid'].bBox.width
        if (tag === 'solid' || tag === 'destructible') {
          entity.setComponent(
            'boundingBox',
            new BoundingBoxComponent(
              new Vec2(config.ground.boundingBox.width, config.ground.boundingBox.height)
            )
          );
        }
        entity.setComponent(
          'transform',
          new TransformComponent(
            new Vec2(x * tileSize, (config.game.gameHeight - 1 - y) * tileSize),
            Vec2.ZERO
          )
        );
        // TODO: Same as above, config['solid'].width?
        entity.setComponent(
          'animation',
          new AnimationComponent(
            this.animations.get(animation)!.duplicate(),
            config.ground.width,
            config.ground.height
          )
        );
      }
    }
  }

  private handleMovement(): void {
    const playerTransformComp = this.player.getComponent('transform');
    const inputComp = this.player.getComponent('input');
    let prevPlayerPos = Vec2.ZERO;

    if (playerTransformComp && inputComp) {
      prevPlayerPos = new Vec2(playerTransformComp.position.x, playerTransformComp.position.y);

      const newPlayerVelocity = new Vec2(0, playerTransformComp.velocity.y);

      if (inputComp.left) {
        newPlayerVelocity.x -= config.player.speed;
        this.player.getComponent('state')!.state = State.RUN;
        this.player.getComponent('state')!.direction = Direction.LEFT;
      }
      if (inputComp.right) {
        newPlayerVelocity.x += config.player.speed;
        this.player.getComponent('state')!.state = State.RUN;
        this.player.getComponent('state')!.direction = Direction.RIGHT;
      }
      if (inputComp.up && inputComp.canJump) {
        inputComp.canJump = false;
        newPlayerVelocity.y -= config.player.jumpSpeed;
        // TODO: This will work but it will be overwritten as soon as you press
        // left or right so the jump animation will not be shown.
        this.player.getComponent('state')!.state = State.JUMP;
      }

      if (newPlayerVelocity.x === 0 && newPlayerVelocity.y === 0) {
        this.player.getComponent('state')!.state = State.IDLE;
      }

      // TODO: Normalise this vector, no?
      // playerTransformComp.velocity = newPlayerVelocity.normalize().multiply(config.player.speed);
      playerTransformComp.velocity = newPlayerVelocity;
      playerTransformComp.position = playerTransformComp.position.add(playerTransformComp.velocity);
    }

    for (const entity of this.entityManager.getAllEntities()) {
      const gravityComp = entity.getComponent('gravity');
      const transformComp = entity.getComponent('transform');

      if (transformComp) {
        const prevPos = transformComp?.position;

        if (gravityComp) {
          transformComp.velocity.y += gravityComp.g;
          transformComp.velocity.y = Math.min(transformComp.velocity.y, config.player.maxFallSpeed);
        }
        transformComp.position = transformComp.position.add(transformComp.velocity);
        transformComp.prevPosition = prevPos;
      }
    }

    if (playerTransformComp) playerTransformComp.prevPosition = prevPlayerPos;
  }

  private checkCollision(): void {
    for (const entity of this.entityManager.getEntitiesByTag('solid')) {
      const overlap = calcOverlap(this.player, entity);

      if (overlap.x >= 0 && overlap.y >= 0) {
        const prevOverlap = calcOverlap(this.player, entity, true);

        // Movement came from left/right
        if (prevOverlap.y > 0) {
          this.player.getComponent('transform')!.velocity.x = 0;

          // Came from right
          if (
            this.player.getComponent('transform')!.position.x >
            entity.getComponent('transform')!.position.x
          ) {
            this.player.getComponent('transform')!.position.x += overlap.x;
          } else {
            // Came from left
            this.player.getComponent('transform')!.position.x -= overlap.x;
          }
        }

        // Movement came from top/bottom
        if (prevOverlap.x > 0) {
          this.player.getComponent('transform')!.velocity.y = 0;

          // Came from bottom
          if (
            this.player.getComponent('transform')!.position.y >
            entity.getComponent('transform')!.position.y
          ) {
            this.player.getComponent('transform')!.position.y += overlap.y;
          } else {
            // Came from top
            this.player.getComponent('transform')!.position.y -= overlap.y;
            this.player.getComponent('input')!.canJump = true;
            if (this.player.getComponent('state')!.state === State.JUMP) {
              this.player.getComponent('state')!.state = State.IDLE;
            }
          }
        }
      }
    }

    for (const entity of this.entityManager.getEntitiesByTag('destructible')) {
      const overlap = calcOverlap(this.player, entity);

      if (overlap.x >= 0 && overlap.y >= 0) {
        const prevOverlap = calcOverlap(this.player, entity, true);

        // Movement came from left/right
        if (prevOverlap.y > 0) {
          this.player.getComponent('transform')!.velocity.x = 0;

          // Came from right
          if (
            this.player.getComponent('transform')!.position.x >
            entity.getComponent('transform')!.position.x
          ) {
            this.player.getComponent('transform')!.position.x += overlap.x;
          } else {
            // Came from left
            this.player.getComponent('transform')!.position.x -= overlap.x;
          }
        }

        // Movement came from top/bottom
        if (prevOverlap.x > 0) {
          this.player.getComponent('transform')!.velocity.y = 0;

          // Came from bottom
          if (
            this.player.getComponent('transform')!.position.y >
            entity.getComponent('transform')!.position.y
          ) {
            this.player.getComponent('transform')!.position.y += overlap.y;
            entity.destroy();
          } else {
            // Came from top
            this.player.getComponent('transform')!.position.y -= overlap.y;
            this.player.getComponent('input')!.canJump = true;
            if (this.player.getComponent('state')!.state === State.JUMP) {
              this.player.getComponent('state')!.state = State.IDLE;
            }
          }
        }
      }
    }
  }

  private handleAnimations(): void {
    for (const entity of this.entityManager.getAllEntities()) {
      const animComp = entity.getComponent('animation');

      if (!animComp) continue;

      // TODO: We assume that `entity` is the player, that okay?
      const stateComp = entity.getComponent('state');
      if (stateComp) {
        switch (stateComp.state) {
          case State.IDLE:
            const idleAnim = this.animations.get('playerIdle')!;
            animComp.anim = idleAnim;
            break;
          case State.JUMP:
            const jumpAnim = this.animations.get('playerJump')!;
            animComp.anim = jumpAnim;
            break;
          case State.RUN:
            const runAnim = this.animations.get('playerRun')!;
            animComp.anim = runAnim;
            break;
        }
      }

      animComp.anim.update();
      if (!animComp.anim.repeating && animComp.anim.hasEnded()) {
        entity.destroy();
      }
    }
  }

  private render(): void {
    this.context.fillStyle = `#e0fcf8`;
    this.context.fillRect(0, 0, this.internalWidth, this.internalHeight);

    // Make sure the player is drawn on top of everything else
    const entities = this.entityManager
      .getAllEntities()
      .filter((entity) => entity.getTag() !== 'player')
      .concat(this.player);

    for (const entity of entities) {
      const transformComp = entity.getComponent('transform');
      const animComp = entity.getComponent('animation');
      if (!transformComp || !animComp) continue;

      if (this.drawTextures) {
        const dx = transformComp.position.x;
        const dy = transformComp.position.y;
        const dw = animComp.width;
        const dh = animComp.height;

        const state = entity.getComponent('state');
        if (!state || state.direction === Direction.RIGHT) {
          this.context.drawImage(animComp.anim.getSprite(), dx, dy, dw, dh);
        } else {
          this.context.save();
          this.context.scale(-1, 1);
          this.context.drawImage(animComp.anim.getSprite(), -dx, dy, -dw, dh);
          this.context.restore();
        }
      }

      if (this.drawBoundingBoxes) {
        const bb = entity.getComponent('boundingBox');
        if (bb) {
          this.context.strokeStyle = 'red';
          this.context.strokeRect(
            transformComp.position.x,
            transformComp.position.y,
            bb.size.x,
            bb.size.y
          );
        }
      }

      if (this.drawGrid) {
        const ts = config.game.tileSize;
        this.context.strokeStyle = 'grey';
        this.context.fillStyle = 'black';
        this.context.font = '9px monospace';

        for (let yy = 0; yy < config.game.gameHeight; yy += 1) {
          for (let xx = 0; xx < config.game.gameWidth; xx += 1) {
            this.context.strokeRect(xx * ts, yy * ts, ts, ts);
            this.context.fillText(
              `${xx},${config.game.gameHeight - yy - 1}`,
              xx * ts,
              yy * ts + 9,
              ts
            );
          }
        }
      }
    }

    if (this.paused) {
      this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.context.fillRect(0, 0, this.internalWidth, this.internalHeight);
      this.context.font = '24px system-ui';
      this.context.fillStyle = 'white';
      const msg = 'Paused';
      const msgWidth = this.context.measureText(msg);
      this.context.fillText(
        msg,
        (config.game.internalWidth - msgWidth.width) / 2,
        (config.game.internalHeight - 24) / 2 + 24
      );
    }
  }
}
