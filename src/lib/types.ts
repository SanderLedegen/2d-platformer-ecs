export interface Level {
  assets: { name: string; imagePath: string }[];
  animations: {
    name: string;
    asset: string;
    numAnimFrames: number;
    singleFrameDuration: number;
    repeating: boolean;
  }[];
  level: {
    animation: string;
    tag: string;
    data: number[][];
  }[];
  player: {
    startX: number;
    startY: number;
  };
}
