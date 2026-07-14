import { PackageCheck, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Days rendered Monday-first, then the weekend. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Ordering must happen this many days before delivery. */
const ORDER_LEAD_DAYS = 2;

export function DeliverySchedule({
  deliveryDays,
}: {
  deliveryDays: number[];
}) {
  const deliverySet = new Set(deliveryDays);
  // Ordering on day D lands a delivery on (D + lead) % 7.
  const orderSet = new Set(
    deliveryDays.map((d) => (d - ORDER_LEAD_DAYS + 7) % 7),
  );

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-sm font-semibold">Delivery schedule</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-brand" />
              Delivery
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full border border-brand" />
              Order by
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_ORDER.map((day) => {
            const isDelivery = deliverySet.has(day);
            const isOrder = orderSet.has(day);
            return (
              <div
                key={day}
                title={FULL_DAY_LABELS[day]}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors",
                  isDelivery
                    ? "border-brand bg-brand text-brand-foreground"
                    : isOrder
                      ? "border-brand bg-brand/10 text-foreground"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {DAY_LABELS[day]}
                </span>
                {isDelivery ? (
                  <Truck className="size-4" aria-label="Delivery" />
                ) : isOrder ? (
                  <PackageCheck
                    className="size-4 text-brand"
                    aria-label="Order by"
                  />
                ) : (
                  <span className="size-4" aria-hidden />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Place each order {ORDER_LEAD_DAYS} days before its delivery.
        </p>
      </CardContent>
    </Card>
  );
}
