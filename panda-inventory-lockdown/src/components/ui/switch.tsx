"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

type SwitchProps = Omit<
  React.ComponentProps<typeof SwitchPrimitive.Root>,
  "className"
> & {
  className?: string
}

function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full bg-muted-foreground/35 outline-none transition-colors after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-amber-600 data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:bg-muted-foreground/45 dark:data-checked:bg-amber-500",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-checked:translate-x-4"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
