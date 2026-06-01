import { Bus, Clock, MapPin, Navigation } from "lucide-react";
import { SidePanel, StatGrid, StatCard, SectionLabel } from "./SidePanel";
import type { ActiveBus } from "../layers/busSimLayer";

function fmtTime(sec: number) {
  const s = ((sec % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
}

export function BusDetailPanel({ bus, currentTimeSec, onClose }: {
  bus: ActiveBus;
  currentTimeSec: number;
  onClose: () => void;
}) {
  const elapsed  = currentTimeSec - bus.startTimeSec;
  const remaining = Math.max(0, bus.endTimeSec - currentTimeSec);
  const pct = Math.round(bus.progress * 100);
  const accentHex = `rgb(${bus.color.join(",")})`;

  const upcoming = bus.timestamps
    .map((ts, i) => ({ ts, idx: i }))
    .filter(({ ts }) => ts > currentTimeSec)
    .slice(0, 5);

  return (
    <SidePanel
      title={bus.route}
      subtitle={bus.headsign || "—"}
      icon={<Bus size={17} className="text-white" />}
      accentColor={accentHex}
      onClose={onClose}
    >
      {/* Sefer saatleri */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock size={11} />{fmtTime(bus.startTimeSec)}</span>
          <span className="font-semibold text-foreground">{pct}%</span>
          <span className="flex items-center gap-1.5">{fmtTime(bus.endTimeSec)}<Navigation size={11} /></span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: accentHex }} />
        </div>
      </div>

      {/* İstatistikler */}
      <StatGrid>
        <StatCard label="Geçen süre" value={`${Math.floor(elapsed / 60)} dk`} />
        <StatCard label="Kalan süre" value={`${Math.ceil(remaining / 60)} dk`} />
      </StatGrid>

      {/* Yaklaşan duraklar */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <SectionLabel><MapPin size={10} className="inline mr-1" />Yaklaşan Duraklar</SectionLabel>
          <div className="space-y-1.5">
            {upcoming.map(({ ts, idx }) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentHex }} />
                  <span className="text-xs font-medium">Durak {idx + 1}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-medium">{fmtTime(ts)}</div>
                  <div className="text-[10px] text-muted-foreground">~{Math.ceil((ts - currentTimeSec) / 60)} dk</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40 text-center">Simüle edilmiş IETT verisi</p>
    </SidePanel>
  );
}
