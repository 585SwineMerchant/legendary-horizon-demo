/** Minimal Tiled JSON shapes used by Codex parsers (orthogonal finite maps only). */

export type TiledProperty = {
  name: string;
  type?: string;
  value: unknown;
};

export type TiledObject = {
  id: number;
  name?: string;
  type?: string;
  visible?: boolean;
  x: number;
  y: number;
  width?: number;
  height?: number;
  properties?: TiledProperty[];
};

export type TiledLayer =
  | {
      type: 'tilelayer';
    }
  | {
      id: number;
      name?: string;
      type: 'objectgroup';
      opacity?: number;
      visible?: boolean;
      objects?: TiledObject[];
    };

export type TiledRoot = {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers?: TiledLayer[];
  properties?: TiledProperty[];
};
