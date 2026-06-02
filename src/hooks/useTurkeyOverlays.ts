import { useEffect, useState } from "react";

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

export interface TurkeyOverlayFlags {
  busRoutes: boolean;
  railLines: boolean;
  bikeLanes: boolean;
  greenAreas: boolean;
  busStops: boolean;
  railStations: boolean;
  evChargingStations: boolean;
  micromobilityParks: boolean;
  toilets: boolean;
  taxiStops: boolean;
  taxiDolmusStops: boolean;
  minibusRoutes: boolean;
  minibusStops: boolean;
  seaStations: boolean;
  kentLokantasi: boolean;
  sosyalTesisler: boolean;
}

function useLazyFeatureCollection(url: string, enabled: boolean) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (data) return;

    const controller = new AbortController();

    async function load() {
      try {
        setError(null);
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status} (${resp.statusText})`);
        const json = (await resp.json()) as FeatureCollection;
        setData(json);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    load();
    return () => controller.abort();
  }, [url, enabled, data]);

  return { data, error };
}

/**
 * Loads Istanbul overlay datasets progressively based on zoom.
 * (Bazı dataset’ler büyük olduğu için ilk ekranda hepsini çekmiyoruz.)
 */
export function useTurkeyOverlays(flags: TurkeyOverlayFlags, zoom: number) {
  // Lines/polygons are visible around neighborhood/streets zoom.
  const showLines = zoom >= 11;
  const showPolygons = zoom >= 10.5;
  // POI LOD — kademeli açılım (otobus gibi)
  const showMajorPoints = zoom >= 12; // raylı istasyonlar, deniz
  const showMidPoints   = zoom >= 13; // otobüs durakları, şarj, mikromobilite
  const showPoints      = zoom >= 14; // tuvalet, taksi, dolmuş, kent lok., sosyal

  // busRoutes her zaman yüklenir (simülasyon geom snapping için gerekli)
  const busRoutes = useLazyFeatureCollection(
    "/data/turkey_overlays/bus_routes_freq.geojson",
    true,
  );
  const railLines = useLazyFeatureCollection(
    "/data/turkey_overlays/rail_lines.geojson",
    flags.railLines && showLines,
  );
  const bikeLanes = useLazyFeatureCollection(
    "/data/turkey_overlays/bike_lanes.geojson",
    flags.bikeLanes && showLines,
  );
  // greenAreas her zaman yüklenir — MapLibre GL katmanı flag değişiminde hemen güncellenir
  const greenAreas = useLazyFeatureCollection(
    "/data/turkey_overlays/green_areas.geojson",
    true,
  );

  const busStops = useLazyFeatureCollection(
    "/data/turkey_overlays/bus_stops.geojson",
    flags.busStops && showMidPoints,
  );
  const railStations = useLazyFeatureCollection(
    "/data/turkey_overlays/rail_stations.geojson",
    flags.railStations && showMajorPoints, // zoom 12+
  );
  const evChargingStations = useLazyFeatureCollection(
    "/data/turkey_overlays/ev_charging_stations.geojson",
    flags.evChargingStations && showMidPoints,
  );
  const micromobilityParks = useLazyFeatureCollection(
    "/data/turkey_overlays/micromobility_parks.geojson",
    flags.micromobilityParks && showMidPoints,
  );
  const toilets = useLazyFeatureCollection(
    "/data/turkey_overlays/toilets.geojson",
    flags.toilets && showPoints,
  );

  const taxiStops = useLazyFeatureCollection(
    "/data/turkey_overlays/taxi_stops.geojson",
    flags.taxiStops && showPoints,
  );
  const taxiDolmusStops = useLazyFeatureCollection(
    "/data/turkey_overlays/taxi_dolmus_stops.geojson",
    flags.taxiDolmusStops && showPoints,
  );
  const minibusRoutes = useLazyFeatureCollection(
    "/data/turkey_overlays/minibus_routes.geojson",
    flags.minibusRoutes && showLines,
  );
  const minibusStops = useLazyFeatureCollection(
    "/data/turkey_overlays/minibus_stops.geojson",
    flags.minibusStops && showMidPoints,
  );
  const seaStations = useLazyFeatureCollection(
    "/data/turkey_overlays/sea_transport_stations.geojson",
    flags.seaStations && showMajorPoints, // zoom 12+
  );
  const kentLokantasi = useLazyFeatureCollection(
    "/data/turkey_overlays/kent_lokantasi.geojson",
    flags.kentLokantasi && showPoints,
  );
  const sosyalTesisler = useLazyFeatureCollection(
    "/data/turkey_overlays/sosyal_tesisler.geojson",
    flags.sosyalTesisler && showPoints,
  );

  return {
    busRoutes: flags.busRoutes ? busRoutes.data : null,  // görsel layer
    busRoutesGeom: busRoutes.data,                       // simülasyon geom (her zaman)
    railLines: flags.railLines ? railLines.data : null,
    bikeLanes: flags.bikeLanes ? bikeLanes.data : null,
    greenAreas: null,        // deck.gl'de render edilmez — MapLibre GL katmanı kullanılıyor
    greenAreasData: greenAreas.data,  // IsparkMap'e MapLibre GL için

    busStops: flags.busStops ? busStops.data : null,
    railStations: flags.railStations ? railStations.data : null,
    evChargingStations: flags.evChargingStations ? evChargingStations.data : null,
    micromobilityParks: flags.micromobilityParks ? micromobilityParks.data : null,
    toilets: flags.toilets ? toilets.data : null,
    taxiStops: flags.taxiStops ? taxiStops.data : null,
    taxiDolmusStops: flags.taxiDolmusStops ? taxiDolmusStops.data : null,
    minibusRoutes: flags.minibusRoutes ? minibusRoutes.data : null,
    minibusStops: flags.minibusStops ? minibusStops.data : null,
    seaStations: flags.seaStations ? seaStations.data : null,
    kentLokantasi: flags.kentLokantasi ? kentLokantasi.data : null,
    sosyalTesisler: flags.sosyalTesisler ? sosyalTesisler.data : null,

    errors: [
      busRoutes.error,
      railLines.error,
      bikeLanes.error,
      greenAreas.error,
      busStops.error,
      railStations.error,
      evChargingStations.error,
      micromobilityParks.error,
      toilets.error,
      taxiStops.error,
      taxiDolmusStops.error,
      minibusRoutes.error,
      minibusStops.error,
      seaStations.error,
      kentLokantasi.error,
      sosyalTesisler.error,
    ].filter((e): e is string => Boolean(e)),
  };
}

