import { useEffect, useState } from "react";

export interface BusTrip {
  route: string;
  headsign: string;
  color: [number, number, number];
  path: [number, number][];
  timestamps: number[];
}

export interface BusSimData {
  routes: Record<string, { name: string; color: [number, number, number] }>;
  trips: BusTrip[];
}

export function useBusSim() {
  const [data, setData] = useState<BusSimData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/data/bus_sim.json")
      .then((r) => r.json())
      .then((d: BusSimData) => { setData(d); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  return { data, loading, error };
}
