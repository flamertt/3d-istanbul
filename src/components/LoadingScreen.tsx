import logo from "../lib/images/logo.png";

interface LoadingScreenProps {
  visible: boolean;
}

export function LoadingScreen({ visible }: LoadingScreenProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-gray-950 flex flex-col items-center justify-center gap-5">
      <img src={logo} alt="Logo" className="h-16 w-auto object-contain invert" />
      <span className="text-gray-500 text-xl tracking-[0.6em]">...</span>
    </div>
  );
}
