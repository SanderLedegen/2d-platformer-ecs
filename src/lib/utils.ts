import { Entity } from './Entity';
import { Vec2 } from './Vec2';

export async function loadImg(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      console.error(`Could not load '${path}'!`);
      reject(e);
    };
    img.src = path;
  });
}

export function calcOverlap(a: Entity, b: Entity, usePrevPos = false): Vec2 {
  const transformA = a.getComponent('transform');
  const transformB = b.getComponent('transform');
  const posA = usePrevPos ? transformA?.prevPosition : transformA?.position;
  const posB = usePrevPos ? transformB?.prevPosition : transformB?.position;
  const bbA = a.getComponent('boundingBox');
  const bbB = b.getComponent('boundingBox');

  if (!posA || !posB || !bbA || !bbB) return Vec2.ZERO;

  const deltaX = Math.abs(posA.x + bbA.halfSize.x - posB.x - bbB.halfSize.x);
  const overlapX = bbA.halfSize.x + bbB.halfSize.x - deltaX;
  const deltaY = Math.abs(posA.y + bbA.halfSize.y - posB.y - bbB.halfSize.y);
  const overlapY = bbA.halfSize.y + bbB.halfSize.y - deltaY;

  return new Vec2(overlapX, overlapY);
}
