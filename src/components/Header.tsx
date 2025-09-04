import { Menu } from "lucide-react";
import Image from "next/image";

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="h-14 mx-auto max-w-7xl px-6 flex items-center justify-between">
        <div className="md:hidden flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={onMenuClick}
            className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Image src="/assets/logo.png" alt="Smarti" width={28} height={28} />
          <span className="font-semibold">Smarti Admin</span>
        </div>
        <div className="text-sm text-slate-600">Admin</div>
      </div>
    </header>
  );
}
