import { Clock, Navigation, TrainFront, Train, Cable } from "lucide-react";
import { SidePanel, StatGrid, StatCard } from "./SidePanel";
import type { ActiveVehicle } from "../layers/railSimLayer";

function fmtTime(sec: number) {
  const s = ((sec % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
}

const KIND_META: Record<ActiveVehicle["kind"], { label: string; Icon: React.ElementType; color: string }> = {
  metro:     { label: "Metro",    Icon: TrainFront, color: "#eab308" },
  marmaray:  { label: "Marmaray", Icon: Train,      color: "#dc2626" },
  tram:      { label: "Tramvay",  Icon: Cable,      color: "#0891b2" },
  funicular: { label: "Füniküler",Icon: Cable,      color: "#7c3aed" },
};

export function RailDetailPanel({ vehicle, currentTimeSec, onClose }: {
  vehicle: ActiveVehicle;
  currentTimeSec: number;
  onClose: () => void;
}) {
  const meta    = KIND_META[vehicle.kind];
  const pct     = Math.round(vehicle.progress * 100);
  const elapsed   = Math.max(0, currentTimeSec - vehicle.t0);
  const remaining = Math.max(0, vehicle.endSec - currentTimeSec);
  const duration  = vehicle.endSec - vehicle.t0;

  return (
    <SidePanel
      title={vehicle.name}
      subtitle={vehicle.headsign || "—"}
      icon={<meta.Icon size={17} className="text-white" />}
      accentColor={meta.color}
      onClose={onClose}
    >
      {/* Tür etiketi */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={{ background: meta.color + "22", border: `1px solid ${meta.color}55`, color: meta.color }}
        >
          <meta.Icon size={10} />
          {meta.label}
        </span>
      </div>

      {/* Sefer ilerlemesi */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            {fmtTime(vehicle.t0)}
          </span>
          <span className="font-semibold text-foreground tabular-nums">{pct}%</span>
          <span className="flex items-center gap-1.5">
            {fmtTime(vehicle.endSec)}
            <Navigation size={11} />
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: meta.color }}
          />
        </div>
      </div>

      {/* İstatistikler */}
      <StatGrid>
        <StatCard label="Toplam süre"  value={`${Math.round(duration / 60)} dk`} />
        <StatCard label="Geçen süre"   value={`${Math.floor(elapsed / 60)} dk`} />
        <StatCard label="Kalan süre"   value={`${Math.ceil(remaining / 60)} dk`} />
        <StatCard label="Hat"          value={vehicle.name} />
      </StatGrid>

      <p className="text-[10px] text-muted-foreground/40 text-center">
        Simüle edilmiş GTFS verisi
      </p>
    </SidePanel>
  );
}
