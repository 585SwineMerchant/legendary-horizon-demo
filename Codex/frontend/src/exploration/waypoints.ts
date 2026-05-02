import type { ParsedLhWaypoint } from '../maps/parseLhTiledMap';

function waypointKey(w: ParsedLhWaypoint): string {
  return (w.waypoint_key && w.waypoint_key.trim()) || `obj:${w.tiled_object_id}`;
}

export function selectActiveWaypoint(
  waypoints: ParsedLhWaypoint[],
  visitedKeys: readonly string[],
): ParsedLhWaypoint | null {
  const set = new Set(visitedKeys);
  return waypoints.find((w) => !set.has(waypointKey(w))) ?? null;
}

export { waypointKey };
