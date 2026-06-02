import { Bus } from "lucide-react";
import type { ActiveBus } from "../layers/busSimLayer";

function fmtTime(sec: number) {
  const s = ((sec % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
}

interface BusListPanelProps {
  buses: ActiveBus[];
  selectedBus: ActiveBus | null;
  onBusClick: (bus: ActiveBus) => void;
}

export function BusListPanel({ buses, selectedBus, onBusClick }: BusListPanelProps) {
  if (buses.length === 0) return null;

  const sorted = [...buses].sort((a, b) => a.route.localeCompare(b.route, "tr", { numeric: true }));

  return (
    <div className="absolute top-20 right-4 w-56 flex flex-col rounded-2xl bg-gray-950/88 backdrop-blur-md border border-gray-800/50 shadow-2xl overflow-hidden pointer-events-auto" style={{ zIndex: 25 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800/60 shrink-0">
        <Bus size={13} className="text-blue-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-200 tracking-wide">Aktif Hatlar</span>
        <span className="ml-auto text-[10px] font-mono text-gray-500">{sorted.length}</span>
      </div>

      {/* List */}
      <div
        className="overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-primary/40
          [scrollbar-width:thin]
          [scrollbar-color:rgba(156,163,175,0.2)_transparent]"
        style={{ maxHeight: "calc(100vh - 14rem)" }}
      >
        {sorted.map((bus) => {
          const accent = `rgb(${bus.color.join(",")})`;
          const isSelected = selectedBus?.route === bus.route && selectedBus?.headsign === bus.headsign;
          const pct = Math.round(bus.progress * 100);

          return (
            <button
              key={`${bus.route}|${bus.headsign}`}
              type="button"
              onClick={() => onBusClick(bus)}
              className={`w-full text-left px-3 py-2 border-b border-gray-800/40 last:border-0 transition-colors ${
                isSelected
                  ? "bg-white/8"
                  : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <span className="text-xs font-bold text-gray-100 leading-none">{bus.route}</span>
                <span className="ml-auto text-[10px] font-mono text-gray-500">{fmtTime(bus.startTimeSec)}</span>
              </div>
              <p className="text-[10px] text-gray-400 truncate mb-1.5 pl-4">{bus.headsign || "—"}</p>
              <div className="pl-4">
                <div className="h-0.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: accent }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
