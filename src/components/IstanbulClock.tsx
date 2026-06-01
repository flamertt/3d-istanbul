import { useEffect, useState } from "react";

function getIstanbulParts() {
  const now = new Date();
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", ...opts }).format(now);

  const time = fmt({ hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const date = fmt({ day: "2-digit", month: "long", year: "numeric" });
  const weekday = fmt({ weekday: "long" });
  const [h, m, s] = time.split(":").map(Number);
  const totalSec = h * 3600 + m * 60 + s;
  const dayProgress = (totalSec / 86400) * 100;

  return { time, date, weekday, dayProgress };
}

export function IstanbulClock() {
  const [parts, setParts] = useState(getIstanbulParts);

  useEffect(() => {
    const id = setInterval(() => setParts(getIstanbulParts()), 1000);
    return () => clearInterval(id);
  }, []);

  const [hm, sec] = parts.time.split(":").slice(0, 2).join(":") + ":" + parts.time.split(":")[2]
    ? [parts.time.slice(0, 5), parts.time.slice(6, 8)]
    : [parts.time.slice(0, 5), "00"];

  return (
    <div className="pointer-events-auto select-none rounded-2xl bg-background/90 backdrop-blur-md border border-border/40 shadow-2xl px-5 py-3.5 flex flex-col items-end gap-1 min-w-[180px]">
      {/* Şehir etiketi */}
      <div className="flex items-center gap-1.5 self-stretch justify-between">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">İstanbul</span>
        <span className="text-[9px] font-medium tracking-wide text-muted-foreground/50">UTC+3</span>
      </div>

      {/* Dijital saat */}
      <div className="font-mono text-3xl font-bold tracking-tight leading-none tabular-nums text-foreground">
        {hm}
        <span className="text-primary/80 animate-pulse">:</span>
        <span className="text-xl font-semibold text-muted-foreground">{sec}</span>
      </div>

      {/* Gün ilerleme çubuğu */}
      <div className="w-full h-0.5 rounded-full bg-border/30 overflow-hidden mt-0.5">
        <div
          className="h-full rounded-full bg-primary/60 transition-all duration-1000"
          style={{ width: `${parts.dayProgress}%` }}
        />
      </div>

      {/* Tarih ve gün */}
      <div className="flex items-baseline gap-2 self-stretch justify-between mt-0.5">
        <span className="text-[10px] font-semibold capitalize text-muted-foreground">{parts.weekday}</span>
        <span className="text-[10px] text-muted-foreground/70">{parts.date}</span>
      </div>
    </div>
  );
}
