import * as React from "react"
import { cn } from "../../lib/utils"
import { Plus, Minus, Locate, Maximize2, Compass } from "lucide-react"

// Ortak glass button stili — tüm floating kontroller aynı tasarım
const glassBtn = "h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all active:scale-95"

export interface MapControlProps {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onLocate?: () => void
  onFullscreen?: () => void
  onResetBearing?: () => void
  showZoom?: boolean
  showLocate?: boolean
  showFullscreen?: boolean
  showCompass?: boolean
  className?: string
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onFullscreen,
  onResetBearing,
  showZoom = true,
  showLocate = true,
  showFullscreen = true,
  showCompass = true,
  className,
  position = "bottom-right",
}: MapControlProps) {
  const positionClasses: Record<string, string> = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  }

  return (
    <div className={cn("absolute z-10 flex flex-col gap-1.5", positionClasses[position], className)}>
      {/* Zoom grubu */}
      {showZoom && (
        <div className="flex flex-col rounded-xl border border-border/40 bg-background/80 backdrop-blur-md shadow-lg overflow-hidden">
          <button type="button" onClick={onZoomIn} className={cn(glassBtn, "border-b border-border/30")} title="Yakınlaştır">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" onClick={onZoomOut} className={glassBtn} title="Uzaklaştır">
            <Minus className="h-4 w-4" />
          </button>
        </div>
      )}

      {showCompass && (
        <div className="rounded-xl border border-border/40 bg-background/80 backdrop-blur-md shadow-lg overflow-hidden">
          <button type="button" onClick={onResetBearing} className={glassBtn} title="Kuzeye Yönel">
            <Compass className="h-4 w-4" />
          </button>
        </div>
      )}

      {showLocate && (
        <div className="rounded-xl border border-border/40 bg-background/80 backdrop-blur-md shadow-lg overflow-hidden">
          <button type="button" onClick={onLocate} className={glassBtn} title="Konumumu Bul">
            <Locate className="h-4 w-4" />
          </button>
        </div>
      )}

      {showFullscreen && (
        <div className="rounded-xl border border-border/40 bg-background/80 backdrop-blur-md shadow-lg overflow-hidden">
          <button type="button" onClick={onFullscreen} className={glassBtn} title="Tam Ekran">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
