import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 p-4">
        {icon ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
