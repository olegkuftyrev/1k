import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  action,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "warning";
}) {
  return (
    <Card size="sm" className="h-16 py-0">
      <CardContent className="flex h-full min-w-0 items-center gap-1.5 p-2.5 sm:gap-2 sm:p-3">
        {icon ? (
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4 sm:size-7",
              tone === "warning" &&
                "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
            )}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] leading-4 font-medium text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "truncate text-xl leading-6 font-semibold tabular-nums",
              tone === "warning" &&
                "text-amber-700 dark:text-amber-400",
            )}
          >
            {value}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
