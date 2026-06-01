import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, Lock, Unlock, Compass, Check } from "lucide-react";

interface CameraControlDropdownProps {
  bearingLocked: boolean;
  cameraLocked: boolean;
  onToggleBearingLock: () => void;
  onToggleCameraLock: () => void;
  onResetNorth: () => void;
}

export function CameraControlDropdown({
  bearingLocked,
  cameraLocked,
  onToggleBearingLock,
  onToggleCameraLock,
  onResetNorth,
}: CameraControlDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  const anyActive = bearingLocked || cameraLocked;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`rounded-2xl backdrop-blur-md border shadow-[0_12px_36px_rgba(0,0,0,0.28)] p-3 transition-colors relative ${
          anyActive
            ? "bg-blue-500/20 border-blue-500/40 text-blue-300 hover:text-blue-200"
            : "bg-gray-950/88 border-gray-800/60 text-gray-200 hover:text-gray-50"
        }`}
        aria-label="Kamera kontrolleri"
        title="Kamera kontrolleri"
      >
        <SlidersHorizontal size={18} />
        {anyActive && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-gray-950/95 backdrop-blur-md border border-gray-800/60 shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-1.5 z-50">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-800/50 mb-1">
            Kamera Kontrolleri
          </p>

          <button
            type="button"
            onClick={() => { onToggleBearingLock(); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-gray-800/60 ${bearingLocked ? "text-blue-300" : "text-gray-200"}`}
          >
            {bearingLocked ? <Lock size={14} className="text-blue-400 shrink-0" /> : <Unlock size={14} className="text-gray-400 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">Açıyı Dondur</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{bearingLocked ? "Kilitli — tekrar bas" : "Mevcut açıyı kilitle"}</div>
            </div>
            {bearingLocked && <Check size={12} className="text-blue-400 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => { onToggleCameraLock(); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-gray-800/60 ${cameraLocked ? "text-blue-300" : "text-gray-200"}`}
          >
            {cameraLocked ? <Lock size={14} className="text-blue-400 shrink-0" /> : <Unlock size={14} className="text-gray-400 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">Kamerayı Dondur</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{cameraLocked ? "Kilitli — tekrar bas" : "Pan/zoom/döndürmeyi kilitle"}</div>
            </div>
            {cameraLocked && <Check size={12} className="text-blue-400 shrink-0" />}
          </button>

          <div className="h-px bg-gray-800/60 my-1" />

          <button
            type="button"
            onClick={() => { onResetNorth(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-gray-800/60 text-gray-200"
          >
            <Compass size={14} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">Kuzeye Döndür</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Açıyı 0°'a sıfırla</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
