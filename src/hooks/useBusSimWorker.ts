/**
 * Bus simulation worker hook — moves trip computation off the main thread.
 * Sends trips once on init, then only sends currentTimeSec each tick.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import type { ActiveBus } from "../layers/busSimLayer";
import type { BusSimData } from "./useBusSim";

type Coord = [number, number];
type RouteGeomEntry = [string, Coord[]];

interface WorkerResult { type: "result"; activeBuses: ActiveBus[] }
interface WorkerReady  { type: "ready" }

export function useBusSimWorker(
  data: BusSimData | null,
  currentTimeSec: number,
  geomEntries: RouteGeomEntry[],
  enabled: boolean,
) {
  const workerRef = useRef<Worker | null>(null);
  const [activeBuses, setActiveBuses] = useState<ActiveBus[]>([]);
  const initializedRef = useRef(false);
  const pendingComputeRef = useRef<number | null>(null);

  // Boot the worker once
  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/busSimWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;
    initializedRef.current = false;

    worker.onmessage = (e: MessageEvent<WorkerResult | WorkerReady>) => {
      if (e.data.type === "ready") {
        initializedRef.current = true;
        // Fire any pending compute
        if (pendingComputeRef.current !== null) {
          worker.postMessage({ type: "compute", currentTimeSec: pendingComputeRef.current });
          pendingComputeRef.current = null;
        }
      } else if (e.data.type === "result") {
        setActiveBuses(e.data.activeBuses);
      }
    };

    return () => { worker.terminate(); workerRef.current = null; };
  }, []);

  // Send trips + geomMap to worker when data loads
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !data) return;
    initializedRef.current = false;
    worker.postMessage({
      type: "init",
      trips: data.trips,
      geomEntries,
    });
  // geomEntries reference changes when busRoutes GeoJSON loads — include it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, geomEntries.length]);

  // Send compute request each tick
  const compute = useCallback(() => {
    const worker = workerRef.current;
    if (!worker || !enabled || !data) return;
    if (!initializedRef.current) {
      pendingComputeRef.current = currentTimeSec;
      return;
    }
    worker.postMessage({ type: "compute", currentTimeSec });
  }, [currentTimeSec, enabled, data]);

  useEffect(() => { compute(); }, [compute]);

  return activeBuses;
}
