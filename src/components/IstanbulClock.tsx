import { useEffect, useState } from "react";

function getIstanbulTime() {
  const utcSec = Math.floor(Date.now() / 1000);
  const totalSec = (utcSec + 3 * 3600) % 86400;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function IstanbulClock() {
  const [time, setTime] = useState(getIstanbulTime);
  useEffect(() => {
    const id = setInterval(() => setTime(getIstanbulTime()), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-10 px-3 flex items-center gap-2 bg-background/80 backdrop-blur-md border border-border/40 shadow-lg rounded-xl">
      <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">İST</span>
      <span className="text-sm font-mono font-bold text-foreground tabular-nums">{time}</span>
    </div>
  );
}
