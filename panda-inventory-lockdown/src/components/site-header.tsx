"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CircleOff,
  LayoutDashboard,
  Menu,
  Store,
  TriangleAlert,
} from "lucide-react";
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
  active: boolean;
  hasReport: boolean;
}

export function SiteHeader({ stores }: { stores: HeaderStore[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
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
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
              <NavLink
                href="/"
                icon={<LayoutDashboard className="size-4" />}
                label="Dashboard"
                active={pathname === "/"}
                onClick={() => setOpen(false)}
              />
              <p className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground">
                Active stores
              </p>
              {stores.filter((store) => store.active).map((s) => (
                <NavLink
                  key={s.number}
                  href={`/stores/${s.number}`}
                  icon={
                    s.hasReport ? (
                      <Store className="size-4" />
                    ) : (
                      <TriangleAlert className="size-4 text-amber-700" />
                    )
                  }
                  label={`PX${s.number}`}
                  hint={
                    s.hasReport
                      ? (s.manager ?? "Manager Not Found")
                      : "Missing report"
                  }
                  active={pathname === `/stores/${s.number}`}
                  onClick={() => setOpen(false)}
                  warning={!s.hasReport}
                />
              ))}
              {stores.some((store) => !store.active) ? (
                <>
                  <p className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground">
                    Inactive
                  </p>
                  {stores.filter((store) => !store.active).map((s) => (
                    <NavLink
                      key={s.number}
                      icon={<CircleOff className="size-4" />}
                      label={`PX${s.number}`}
                      hint={s.manager ?? "Manager Not Found"}
                      disabled
                    />
                  ))}
                </>
              ) : null}
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
            nativeButton={false}
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
  warning,
  disabled,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  warning?: boolean;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate font-medium",
            disabled ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {label}
        </span>
        {hint ? (
          <span
            className={cn(
              "truncate text-xs",
              warning ? "font-medium text-amber-700" : "text-muted-foreground",
            )}
          >
            {hint}
          </span>
        ) : null}
      </span>
    </>
  );
  const className = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
    disabled && "cursor-not-allowed bg-muted/40 text-muted-foreground",
    !disabled && "transition-colors",
    !disabled && active
      ? "bg-accent text-accent-foreground"
      : !disabled &&
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  );

  if (disabled || !href) {
    return (
      <div className={className} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {content}
    </Link>
  );
}
