import { MapPin, Clock, Car, Navigation2, ParkingSquare } from "lucide-react";
import type { IsparkLot } from "../types";
import type { RouteMode, RouteState } from "../hooks/useRoute";
import { DirectionsSection } from "./DirectionsSection";
import { cn } from "../lib/utils";
import { SidePanel, StatGrid, StatCard, SectionLabel } from "./SidePanel";

function formatNullableNumber(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return null;
  return v.toLocaleString();
}

export function IsparkLotDetailPanel({
  lot,
  onClose,
  onGetDirections,
  route,
}: {
  lot: IsparkLot;
  onClose: () => void;
  onGetDirections?: (lat: number, lng: number, mode: RouteMode) => void;
  route?: RouteState;
}) {
  const isOpen = lot.isOpen;
  const occupancyRatio = lot.capacity > 0 ? (lot.capacity - lot.emptyCapacity) / lot.capacity : 0;
  const occupancyPct = Math.round(occupancyRatio * 100);
  const barColor = occupancyPct > 90 ? "#ef4444" : occupancyPct > 70 ? "#f59e0b" : "#3b82f6";

  return (
    <SidePanel
      title={lot.name || "İsimsiz Otopark"}
      subtitle={lot.district}
      icon={<ParkingSquare size={17} className="text-white" />}
      accentColor="#1d4ed8"
      onClose={onClose}
    >
      {/* Durum + Tip */}
      <StatGrid>
        <StatCard
          label="Durum"
          value={
            <span className={isOpen ? "text-emerald-500" : "text-destructive"}>
              {isOpen ? "Açık" : "Kapalı"}
            </span>
          }
        />
        <StatCard label="Otopark Tipi" value={lot.parkType || "—"} />
      </StatGrid>

      {/* Doluluk */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <SectionLabel>Kapasite</SectionLabel>
          <span className="text-xs font-semibold text-foreground">%{occupancyPct} dolu</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${occupancyPct}%`, backgroundColor: barColor }} />
        </div>
        <StatGrid>
          <StatCard label="Toplam yer" value={<span className="font-mono">{lot.capacity.toLocaleString()}</span>} />
          <StatCard label="Boş yer" value={<span className="font-mono text-emerald-500">{lot.emptyCapacity.toLocaleString()}</span>} />
        </StatGrid>
      </div>

      {/* Ek bilgiler */}
      {(formatNullableNumber(lot.freeTimeMinutes ?? null) || lot.workHours) && (
        <div className="space-y-2">
          <SectionLabel>Ek Bilgiler</SectionLabel>
          <div className="space-y-1.5">
            {formatNullableNumber(lot.freeTimeMinutes ?? null) && (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/20">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock size={14} className="text-primary" />Ücretsiz süre</span>
                <span className="text-sm font-semibold">{formatNullableNumber(lot.freeTimeMinutes ?? null)} dk</span>
              </div>
            )}
            {lot.workHours && (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/20">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Car size={14} className="text-primary" />Çalışma saatleri</span>
                <span className="text-sm font-semibold text-right">{lot.workHours}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yol tarifi */}
      <div className="space-y-2">
        <SectionLabel><Navigation2 size={10} className="inline mr-1" />Yol Tarifi</SectionLabel>
        <DirectionsSection lat={lot.lat} lng={lot.lng} onGetDirections={onGetDirections} route={route} />
      </div>
    </SidePanel>
  );
}
