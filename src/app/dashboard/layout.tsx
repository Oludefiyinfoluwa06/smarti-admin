"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="md:grid md:grid-cols-[260px_1fr]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <section className="min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="mx-auto max-w-7xl px-6 py-8">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
