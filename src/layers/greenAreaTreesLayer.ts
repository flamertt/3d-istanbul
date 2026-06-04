import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import type { Layer } from "deck.gl";

type GreenAreasData = GeoJSON.FeatureCollection | GeoJSON.GeometryCollection | null;

export interface TreePoint {
  position: [number, number, number];
}

function pointInPolygon(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function ringArea(ring: number[][]): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(area / 2);
}

const D_LNG = 0.00048;
const D_LAT = 0.00036;
const MIN_AREA_DEG2 = 8.7e-8;
const MAX_TREES_PER_POLY = 60;

// Spatial index — 0.005° grid (~500m cells) for building polygon lookup
const CELL = 0.005;

interface BuildingIndex {
  cells: Map<string, number[]>;
  rings: [number, number][][];
}

function buildBuildingIndex(buildingRings: [number, number][][]): BuildingIndex {
  const cells = new Map<string, number[]>();
  for (let i = 0; i < buildingRings.length; i++) {
    const ring = buildingRings[i];
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    for (let x = Math.floor(minLng / CELL); x <= Math.floor(maxLng / CELL); x++) {
      for (let y = Math.floor(minLat / CELL); y <= Math.floor(maxLat / CELL); y++) {
        const key = `${x},${y}`;
        const arr = cells.get(key);
        if (arr) arr.push(i);
        else cells.set(key, [i]);
      }
    }
  }
  return { cells, rings: buildingRings };
}

function insideBuilding(lng: number, lat: number, idx: BuildingIndex): boolean {
  const key = `${Math.floor(lng / CELL)},${Math.floor(lat / CELL)}`;
  const candidates = idx.cells.get(key);
  if (!candidates) return false;
  for (const i of candidates) {
    if (pointInPolygon(lng, lat, idx.rings[i] as number[][])) return true;
  }
  return false;
}

function centroidOfRing(ring: number[][]): [number, number] {
  let x = 0, y = 0;
  for (const [lng, lat] of ring) { x += lng; y += lat; }
  return [x / ring.length, y / ring.length];
}

function treesForRing(ring: number[][], buildingIdx: BuildingIndex | null): TreePoint[] {
  if (ringArea(ring) < MIN_AREA_DEG2) return [];

  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const points: TreePoint[] = [];
  const lngStart = minLng + D_LNG * 0.5;
  const latStart = minLat + D_LAT * 0.5;

  for (let lat = latStart; lat < maxLat; lat += D_LAT) {
    const lngOffset = ((Math.round((lat - latStart) / D_LAT) % 2) * D_LNG) / 2;
    for (let lng = lngStart + lngOffset; lng < maxLng; lng += D_LNG) {
      if (!pointInPolygon(lng, lat, ring)) continue;
      if (buildingIdx && insideBuilding(lng, lat, buildingIdx)) continue;
      points.push({ position: [lng, lat, 0] });
      if (points.length >= MAX_TREES_PER_POLY) return points;
    }
  }

  // Poligon area threshold'u geçti ama grid içine düşmedi (dar/küçük alan):
  // centroid'e fallback
  if (points.length === 0) {
    const [lng, lat] = centroidOfRing(ring);
    if (pointInPolygon(lng, lat, ring) && !(buildingIdx && insideBuilding(lng, lat, buildingIdx))) {
      points.push({ position: [lng, lat, 0] });
    }
  }

  return points;
}

export function computeTreePoints(
  data: GreenAreasData,
  buildingRings: [number, number][][],
): TreePoint[] {
  if (!data) return [];

  const buildingIdx = buildingRings.length > 0 ? buildBuildingIndex(buildingRings) : null;
  const result: TreePoint[] = [];

  const handleGeom = (geom: GeoJSON.Geometry) => {
    if (geom.type === "Polygon") {
      result.push(...treesForRing(geom.coordinates[0] as number[][], buildingIdx));
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates as number[][][]) {
        result.push(...treesForRing(poly[0], buildingIdx));
      }
    }
  };

  const d = data as GeoJSON.FeatureCollection | GeoJSON.GeometryCollection;
  if (d.type === "FeatureCollection" && Array.isArray(d.features)) {
    for (const f of d.features) { if (f.geometry) handleGeom(f.geometry); }
  } else if (d.type === "GeometryCollection" && Array.isArray(d.geometries)) {
    for (const geom of d.geometries) { if (geom) handleGeom(geom); }
  }

  console.log(`[GreenTrees] ${result.length} ağaç hesaplandı (buildingRings: ${buildingRings.length})`);
  return result;
}

export function createGreenAreaTreesLayer(
  points: TreePoint[],
  zoom: number,
  enabled: boolean,
): Layer[] {
  if (!enabled || points.length === 0 || zoom < 13) return [];

  return [
    new ScenegraphLayer<TreePoint>({
      id: "green-area-trees",
      data: points,
      scenegraph: "/models/agac.gltf",
      pickable: false,
      getPosition: (d) => d.position,
      getOrientation: [0, 0, 90],
      sizeScale: 2,
      getScale: [1, 1, 1],
      getColor: [255, 255, 255, 230],
      _lighting: "pbr",
    }),
  ];
}
