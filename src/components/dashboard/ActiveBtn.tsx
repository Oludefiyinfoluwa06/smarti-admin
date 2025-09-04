import { Loader2 } from "lucide-react";

export default function ActionBtn({
  label,
  icon,
  onClick,
  busy,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-md border border-slate-300 text-slate-700 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon} {label}
    </button>
  );
}
