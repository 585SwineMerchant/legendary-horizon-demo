/** Tiled JSON shapes used by Codex parsers (orthogonal maps; tile + object groups). */

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
  rotation?: number;
  properties?: TiledProperty[];
};

export type TiledTileLayer = {
  id: number;
  name?: string;
  type: 'tilelayer';
  x?: number;
  y?: number;
  width: number;
  height: number;
  data?: number[];
  visible?: boolean;
  opacity?: number;
  compression?: string;
};

export type TiledObjectGroupLayer = {
  id: number;
  name?: string;
  type: 'objectgroup';
  opacity?: number;
  visible?: boolean;
  x?: number;
  y?: number;
  draworder?: string;
  objects?: TiledObject[];
};

export type TiledLayer = TiledTileLayer | TiledObjectGroupLayer;

export type TiledMapTilesetRef = {
  firstgid?: number;
  name?: string;
  /** External `.tsx` path — not loadable in the browser; tilesets must be embedded with `image`. */
  source?: string;
  image?: string;
};

export type TiledRoot = {
  type?: string;
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  orientation?: string;
  infinite?: boolean;
  layers?: TiledLayer[];
  properties?: TiledProperty[];
  tilesets?: TiledMapTilesetRef[];
};
