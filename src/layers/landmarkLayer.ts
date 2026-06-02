import { IconLayer } from "@deck.gl/layers";
import type { Layer } from "deck.gl";
import type { Landmark } from "../types";
import { buildCircleIcon, ICON_PATHS } from "../lib/iconBuilder";

const CATEGORY_COLORS: Record<string, string> = {
  mosque:     "#1e40af",
  palace:     "#be185d",
  market:     "#b45309",
  museum:     "#7c22ce",
  tower:      "#374151",
  street:     "#059669",
  square:     "#2563eb",
  castle:     "#991b1b",
  island:     "#0ea5e9",
  university: "#4f46e5",
  viewpoint:  "#d946ef",
  stadium:    "#16a34a",
  mall:       "#db2777",
  theatre:    "#ea580c",
  monument:   "#6b7280",
  library:    "#65a30d",
  other:      "#6b7280",
};

const CATEGORY_ICON: Record<string, string> = {
  mosque:     ICON_PATHS.mosque,
  palace:     ICON_PATHS.castle,
  market:     ICON_PATHS.mall,
  museum:     ICON_PATHS.museum,
  tower:      ICON_PATHS.monument,
  street:     ICON_PATHS.monument,
  square:     ICON_PATHS.monument,
  castle:     ICON_PATHS.castle,
  island:     ICON_PATHS.viewpoint,
  university: ICON_PATHS.university,
  viewpoint:  ICON_PATHS.viewpoint,
  stadium:    ICON_PATHS.stadium,
  mall:       ICON_PATHS.mall,
  theatre:    ICON_PATHS.theatre,
  monument:   ICON_PATHS.monument,
  library:    ICON_PATHS.library,
  other:      ICON_PATHS.viewpoint,
};

const iconCache = new Map<string, string>();
function createSvgIcon(category: string): string {
  if (iconCache.has(category)) return iconCache.get(category)!;
  const path = CATEGORY_ICON[category] ?? ICON_PATHS.viewpoint;
  const color = CATEGORY_COLORS[category] ?? "#6b7280";
  const url = buildCircleIcon(path, color);
  iconCache.set(category, url);
  return url;
}

export function createLandmarkLayer(
  landmarks: Landmark[],
  zoom: number,
  onClick?: (landmark: Landmark) => void
): Layer | null {
  if (!landmarks.length || zoom < 10) return null;

  return new IconLayer<Landmark>({
    id: "landmark-layer",
    data: landmarks,
    pickable: true,
    sizeUnits: "pixels",
    getPosition: (d) => [d.coordinates[0], d.coordinates[1]],
    getIcon: (d) => {
      return {
        url: createSvgIcon(d.category),
        width: 100,
        height: 100,
        anchorY: 50, // Point icons are now centered circles
      };
    },
    getSize: (d) => (zoom >= 14 ? 26 : 20),
    getColor: [255, 255, 255],
    updateTriggers: { getSize: zoom },
    onClick: (info) => {
      if (info.object && onClick) {
        onClick(info.object);
      }
    },
  });
}
