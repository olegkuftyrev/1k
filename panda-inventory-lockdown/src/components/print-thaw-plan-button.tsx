"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintPlanButton({
  disabled = false,
  label = "Print plan",
}: {
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={() => window.print()}
      disabled={disabled}
    >
      <Printer className="size-4" />
      {label}
    </Button>
  );
}

export function PrintThawPlanButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <PrintPlanButton
      disabled={disabled}
      label="Print thaw plan"
    />
  );
}
