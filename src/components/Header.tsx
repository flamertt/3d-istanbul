import type { ReactNode } from "react";
import logo from "../lib/images/logo.png";

interface HeaderProps {
  generated: string | null;
}

export function Header({ generated }: HeaderProps) {
  const freshness = generated
    ? new Date(generated).toLocaleDateString("tr-TR", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="w-72 bg-background/80 backdrop-blur-md border border-border/40 shadow-lg rounded-xl p-4 flex flex-col items-center gap-2">
      <img src={logo} alt="Logo" className="h-10 w-full object-contain dark:invert" />
      {freshness && (
        <p className="text-[10px] text-muted-foreground/50">{freshness}</p>
      )}
    </div>
  );
}
