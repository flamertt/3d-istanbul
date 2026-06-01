import { Play, Pause, Clock, FastForward } from "lucide-react";

interface BusTimeControlProps {
  timeSec: number;
  playing: boolean;
  speed: number;
  onTimeChange: (sec: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [1, 5, 15, 30];

function fmtTime(sec: number) {
  const s = ((sec % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
}

export function BusTimeControl({ timeSec, playing, speed, onTimeChange, onTogglePlay, onSpeedChange }: BusTimeControlProps) {
  const MIN_SEC = 5 * 3600;
  const MAX_SEC = 24 * 3600;
  const clamped = Math.max(MIN_SEC, Math.min(MAX_SEC, timeSec));
  const pct = ((clamped - MIN_SEC) / (MAX_SEC - MIN_SEC)) * 100;

  return (
    <div className="px-2 pb-3 pt-1 flex flex-col gap-2">
      {/* Üst satır: saat + oynat/duraklat */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-primary">
          <Clock size={11} />
          <span>{fmtTime(timeSec)}</span>
        </div>
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {playing ? <Pause size={11} /> : <Play size={11} />}
          <span>{playing ? "Duraklat" : "Oynat"}</span>
        </button>
      </div>

      {/* Slider */}
      <div
        className="relative h-1.5 rounded-full bg-border/40 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onTimeChange(MIN_SEC + p * (MAX_SEC - MIN_SEC));
        }}
      >
        <div className="absolute left-0 top-0 h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background shadow"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-muted-foreground/50 font-mono">
        <span>05:00</span>
        <span>12:00</span>
        <span>24:00</span>
      </div>

      {/* Hız seçimi */}
      <div className="flex items-center gap-1.5">
        <FastForward size={10} className="text-muted-foreground/60 shrink-0" />
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
