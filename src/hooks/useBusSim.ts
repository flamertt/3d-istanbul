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

// Fix strings that were encoded as Latin-1 but stored as UTF-8 bytes.
// e.g. "Ã‡" → "Ç"
function fixStr(s: string): string {
  try {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return s;
  }
}

function fixEncoding(d: BusSimData): BusSimData {
  const routes: BusSimData["routes"] = {};
  for (const [k, v] of Object.entries(d.routes)) {
    routes[k] = { ...v, name: fixStr(v.name) };
  }
  const trips = d.trips.map((t) => ({
    ...t,
    route: fixStr(t.route),
    headsign: fixStr(t.headsign),
  }));
  return { routes, trips };
}

export function useBusSim() {
  const [data, setData] = useState<BusSimData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/data/bus_sim.json")
      .then((r) => r.json())
      .then((d: BusSimData) => { setData(fixEncoding(d)); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  return { data, loading, error };
}
