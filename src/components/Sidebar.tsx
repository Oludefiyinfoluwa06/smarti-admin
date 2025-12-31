"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/orders", label: "Orders" },
    { href: "/dashboard/newsletter", label: "Newsletter" },
    { href: "/dashboard/courses", label: "Courses" },
    { href: "/dashboard/payments", label: "Payments" },
    { href: "/dashboard/enrollments", label: "Enrollments" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`${open ? "fixed" : "hidden"} inset-0 z-40 bg-black/30 md:hidden`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={
          `${open ? "translate-x-0" : "-translate-x-full"} ` + // mobile slide
          `fixed z-50 inset-y-0 left-0 w-64 md:w-[260px] ` + // base positioning
          `md:translate-x-0 md:sticky md:top-0 md:h-screen ` + // md+ layout & full height
          `flex flex-col border-r border-slate-200 bg-white transition-transform`
        }
      >
        <div className="h-14 px-4 flex items-center gap-3 border-b border-slate-200">
          <Image src="/assets/logo.png" alt="Smarti" width={28} height={28} />
          <span className="font-semibold">Smarti Admin</span>
        </div>
        <nav className="p-3 text-sm">
          <div className="mb-2 px-2 text-xs font-medium text-slate-500 uppercase">Overview</div>
          <ul className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-100 ${active ? "bg-slate-100 text-slate-900" : "text-slate-700"}`}
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
