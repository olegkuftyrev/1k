"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, LayoutDashboard, Menu, Store } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface HeaderStore {
  number: string;
  manager?: string;
}

export function SiteHeader({ stores }: { stores: HeaderStore[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground">
                  <Boxes className="size-4" />
                </span>
                Panda Lockdown
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-2">
              <NavLink
                href="/"
                icon={<LayoutDashboard className="size-4" />}
                label="Dashboard"
                active={pathname === "/"}
                onClick={() => setOpen(false)}
              />
              <p className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground">
                Stores
              </p>
              {stores.map((s) => (
                <NavLink
                  key={s.number}
                  href={`/stores/${s.number}`}
                  icon={<Store className="size-4" />}
                  label={`Store ${s.number}`}
                  hint={s.manager ?? "Manager Not Found"}
                  active={pathname === `/stores/${s.number}`}
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground">
            <Boxes className="size-4" />
          </span>
          <span className="hidden sm:inline">Panda Lockdown</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <Button
            variant={pathname === "/" ? "secondary" : "ghost"}
            size="sm"
            render={<Link href="/" />}
          >
            Dashboard
          </Button>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{label}</span>
        {hint ? (
          <span className="truncate text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </Link>
  );
}
