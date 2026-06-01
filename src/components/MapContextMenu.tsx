import { useEffect, useRef } from "react";
import { Lock, Unlock, Compass, Copy, Navigation } from "lucide-react";

export interface ContextMenuState {
  x: number;
  y: number;
  lng: number;
  lat: number;
}

interface MapContextMenuProps {
  menu: ContextMenuState | null;
  bearingLocked: boolean;
  cameraLocked: boolean;
  onClose: () => void;
  onToggleBearingLock: () => void;
  onToggleCameraLock: () => void;
  onResetNorth: () => void;
  onCopyCoords: (lng: number, lat: number) => void;
  onGetDirections: (lat: number, lng: number) => void;
}

export function MapContextMenu({
  menu,
  bearingLocked,
  cameraLocked,
  onClose,
  onToggleBearingLock,
  onToggleCameraLock,
  onResetNorth,
  onCopyCoords,
  onGetDirections,
}: MapContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const item = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    active?: boolean,
    subtitle?: string,
  ) => (
    <button
      type="button"
      onClick={() => { onClick(); onClose(); }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-gray-800/60 ${active ? "text-blue-300" : "text-gray-200"}`}
    >
      <span className={`shrink-0 ${active ? "text-blue-400" : "text-gray-400"}`}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-medium leading-tight">{label}</div>
        {subtitle && <div className="text-[10px] text-gray-500 mt-0.5">{subtitle}</div>}
      </div>
      {active && <span className="ml-auto text-[10px] text-blue-400 font-medium">Aktif</span>}
    </button>
  );

  return (
    <div
      ref={ref}
      style={{ left: menu.x, top: menu.y }}
      className="fixed z-50 w-56 rounded-xl bg-gray-950/95 backdrop-blur-md border border-gray-800/60 shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-1.5 select-none"
    >
      <div className="px-3 py-1.5 mb-1 border-b border-gray-800/50">
        <p className="text-[10px] text-gray-500 font-mono">
          {menu.lat.toFixed(5)}, {menu.lng.toFixed(5)}
        </p>
      </div>

      {item(<Lock size={14} />, "Açıyı Dondur", onToggleBearingLock, bearingLocked, bearingLocked ? "Mevcut açı kilitli" : "Harita açısını kilitle")}
      {item(<Lock size={14} />, "Kamerayı Dondur", onToggleCameraLock, cameraLocked, cameraLocked ? "Pan/zoom/döndürme kilitli" : "Tüm kamera hareketini kilitle")}

      <div className="h-px bg-gray-800/60 my-1" />

      {item(<Compass size={14} />, "Kuzeye Döndür", onResetNorth, false, "Açıyı 0°'a sıfırla")}
      {item(<Copy size={14} />, "Koordinatı Kopyala", () => onCopyCoords(menu.lng, menu.lat), false, `${menu.lat.toFixed(5)}, ${menu.lng.toFixed(5)}`)}

      <div className="h-px bg-gray-800/60 my-1" />

      {item(<Navigation size={14} />, "Buraya Yol Tarifi Al", () => onGetDirections(menu.lat, menu.lng), false, "Konumunuzdan rota hesapla")}
    </div>
  );
}
