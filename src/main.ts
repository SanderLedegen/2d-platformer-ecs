import level1 from './levels/level1.json';
import { Animation } from './lib/Animation';
import { Game } from './lib/Game';
import { Level } from './lib/types';
import { loadImg } from './lib/utils';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;

const level: Level = level1;

const assetMap: Map<string, HTMLImageElement> = new Map();
for (const asset of level.assets) {
  const img = await loadImg(asset.imagePath);
  assetMap.set(asset.name, img);
}

const animationMap: Map<string, Animation> = new Map();
for (const anim of level.animations) {
  const asset = assetMap.get(anim.asset)!;

  const animation = new Animation(
    asset,
    anim.numAnimFrames,
    anim.singleFrameDuration,
    anim.repeating
  );
  animationMap.set(anim.name, animation);
}

const game = new Game(context, animationMap, level);
canvas.addEventListener('keydown', game.handleInput.bind(game));
canvas.addEventListener('keyup', game.handleInput.bind(game));

game.run();
