"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, PlusCircle, ReceiptText, Tags, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receipts", label: "Receipts", icon: ReceiptText },
  { href: "/receipts/new", label: "Add receipt", icon: PlusCircle },
  { href: "/categories", label: "Categories", icon: Tags },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/receipts") return pathname === "/receipts" || /^\/receipts\/[^/]+\/edit$/.test(pathname);
  return pathname === href;
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active ? "bg-primary-soft text-primary-hover" : "text-muted hover:bg-stone-100 hover:text-ink",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg text-lg font-semibold text-ink">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
        <Wallet className="h-5 w-5" aria-hidden="true" />
      </span>
      EasyReceipt
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white md:block">
        <div className="sticky top-0 p-5">
          <Brand />
          <nav aria-label="Main" className="mt-8">
            <NavLinks pathname={pathname} />
          </nav>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b border-line bg-white md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-stone-100"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
        <nav id="mobile-nav" aria-label="Main" hidden={!open} className="border-t border-line px-4 py-3">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
      </header>
    </>
  );
}
