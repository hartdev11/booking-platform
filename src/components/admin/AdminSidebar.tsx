"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface AdminSidebarProps {
  tenantName: string;
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/services", label: "บริการ" },
  { href: "/admin/staff", label: "พนักงาน" },
];

export function AdminSidebar({ tenantName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed top-4 left-4 z-50 rounded-lg border border-(--border-default) bg-(--surface-secondary) p-2 text-(--text-primary) md:hidden"
        aria-label="เมนู"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-(--border-default) bg-(--surface-primary) transition-transform duration-300 ease-out md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="p-4 border-b border-(--border-subtle)">
            <p className="text-xs text-(--text-muted)">ร้าน</p>
            <p className="font-medium text-(--text-primary) truncate">{tenantName || "—"}</p>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-(--brand-primary)/20 text-(--brand-primary)"
                      : "text-(--text-secondary) hover:bg-(--surface-tertiary) hover:text-(--text-primary)"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-(--border-subtle)">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-(--border-default) px-3 py-2.5 text-sm text-(--text-secondary) hover:bg-(--surface-tertiary) transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          aria-label="ปิด"
        />
      )}
    </>
  );
}
