import { Bus } from "lucide-react";
import { SidePanel, StatGrid, StatCard, SectionLabel } from "./SidePanel";

type PropsMap = Record<string, unknown>;

function pickString(p: PropsMap, keys: string[]): string {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === "string" && v.trim().length) return v.trim();
  }
  return "";
}

function pickNumberLike(p: PropsMap, keys: string[]): string {
  const s = pickString(p, keys);
  return s ? s.replace(",", ".").trim() : "";
}

export function BusRouteDetailPanel({ routeProps, onClose }: { routeProps: PropsMap; onClose: () => void }) {
  const hatKodu    = pickString(routeProps, ["HAT_KODU"]);
  const hatAdi     = pickString(routeProps, ["HAT_ADI"]);
  const yon        = pickString(routeProps, ["YON"]);
  const hatBasi    = pickString(routeProps, ["HAT_BASI"]);
  const hatSonu    = pickString(routeProps, ["HAT_SONU"]);
  const durum      = pickString(routeProps, ["DURUM"]);
  const guzKodu    = pickString(routeProps, ["GUZERGAH_KODU"]);
  const uzunluk    = pickNumberLike(routeProps, ["UZUNLUK"]);
  const sure       = pickNumberLike(routeProps, ["SURE", "SÜRE"]);

  const title = hatKodu || hatAdi || "Otobüs Hattı";
  const subtitle = hatAdi && hatKodu ? hatAdi : (yon || undefined);

  return (
    <SidePanel
      title={title}
      subtitle={subtitle}
      icon={<Bus size={17} className="text-white" />}
      accentColor="#2563eb"
      onClose={onClose}
    >
      {/* Hat terminalleri */}
      {(hatBasi || hatSonu) && (
        <div className="space-y-2">
          <SectionLabel>Güzergah</SectionLabel>
          <div className="space-y-1.5">
            {hatBasi && (
              <div className="px-3 py-2.5 rounded-lg border border-border bg-muted/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Başlangıç</p>
                <p className="text-sm font-medium">{hatBasi}</p>
              </div>
            )}
            {hatSonu && (
              <div className="px-3 py-2.5 rounded-lg border border-border bg-muted/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Bitiş</p>
                <p className="text-sm font-medium">{hatSonu}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* İstatistikler */}
      {(uzunluk || sure) && (
        <StatGrid>
          {uzunluk && <StatCard label="Uzunluk" value={uzunluk} />}
          {sure && <StatCard label="Süre" value={sure} />}
        </StatGrid>
      )}

      {/* Detay */}
      {(durum || guzKodu) && (
        <div className="space-y-2">
          <SectionLabel>Detay</SectionLabel>
          <div className="px-3 py-2.5 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground space-y-1">
            {guzKodu && <p>Güzergah: <span className="text-foreground font-medium">{guzKodu}</span></p>}
            {durum && <p>Durum: <span className="text-foreground font-medium">{durum}</span></p>}
          </div>
        </div>
      )}
    </SidePanel>
  );
}
