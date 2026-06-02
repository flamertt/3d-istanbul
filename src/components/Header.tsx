import logo from "../lib/images/logo.png";

export function Header() {
  return (
    <div className="w-full md:w-72 bg-background/80 backdrop-blur-md border border-border/40 shadow-lg rounded-xl p-4 flex items-center justify-center">
      <img src={logo} alt="Logo" className="h-10 w-full object-contain dark:invert" />
    </div>
  );
}
