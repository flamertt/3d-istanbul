import { useEffect, useState } from "react";

export interface BusTrip {
  route: string;
  headsign: string;
  color: [number, number, number];
  path: [number, number][];
  timestamps: number[];
}

export interface BusStop {
  name: string;
  elapsed_secs: number;
}

export interface BusSimData {
  routes: Record<string, { name: string; color: [number, number, number] }>;
  trips: BusTrip[];
  stopsByRoute?: Record<string, BusStop[]>;
}

// UTF-8 bytes were misread as Windows-1252, then re-encoded as UTF-8.
// This map converts the Windows-1252 special range (0x80–0x9F) back to bytes.
const WIN1252: Record<number, number> = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
};

function fixStr(s: string): string {
  // Build the cp1252 byte array. If any char can't be encoded in cp1252
  // (cp > 0xFF and not in WIN1252), the string is already correct — leave it.
  try {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      const cp = s.charCodeAt(i);
      if (cp <= 0xFF) { bytes[i] = cp; continue; }
      const b = WIN1252[cp];
      if (b === undefined) return s; // properly encoded Unicode char → don't touch
      bytes[i] = b;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
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

  // stopsByRoute key'leri de encoding fix gerektiriyor
  // (trip.route ile aynı şekilde fix edilmeli ki lookup çalışsın)
  let stopsByRoute: BusSimData["stopsByRoute"];
  if (d.stopsByRoute) {
    stopsByRoute = {};
    for (const [k, stops] of Object.entries(d.stopsByRoute)) {
      const fixedKey = fixStr(k);
      stopsByRoute[fixedKey] = stops.map((s) => ({
        ...s,
        name: fixStr(s.name),
      }));
    }
  }

  return { routes, trips, stopsByRoute };
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
