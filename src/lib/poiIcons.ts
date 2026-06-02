import { buildCircleIcon, ICON_PATHS } from "./iconBuilder";

export const POI_ICON_URLS = {
  busStop:       buildCircleIcon(ICON_PATHS.busStop,       "#2563eb"),
  railStation:   buildCircleIcon(ICON_PATHS.railStation,   "#7c3aed"),
  evCharging:    buildCircleIcon(ICON_PATHS.evCharging,    "#d97706"),
  micromobility: buildCircleIcon(ICON_PATHS.micromobility, "#ea580c"),
  toilet:        buildCircleIcon(ICON_PATHS.toilet,        "#e11d48"),
  taxi:          buildCircleIcon(ICON_PATHS.taxi,          "#c026d3"),
  taxiDolmus:    buildCircleIcon(ICON_PATHS.minibus,       "#e11d48"),
  minibus:       buildCircleIcon(ICON_PATHS.minibus,       "#059669"),
  seaStation:    buildCircleIcon(ICON_PATHS.seaStation,    "#0369a1"),
  kentLokantasi: buildCircleIcon(ICON_PATHS.fork,         "#d97706"),
  sosyalTesis:   buildCircleIcon(ICON_PATHS.heart,        "#db2777"),
} as const;
