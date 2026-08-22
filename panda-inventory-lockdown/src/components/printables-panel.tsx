import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Carrot,
  Drumstick,
  Printer,
  Refrigerator,
  Snowflake,
} from "lucide-react";

export function PrintablesPanel({ storeNumber }: { storeNumber: string }) {
  const printables = [
    {
      label: "24-Hour Thawing Cabinet Plan",
      href: `/stores/${storeNumber}/thaw-plan?location=cabinet`,
      icon: <Snowflake />,
    },
    {
      label: "WIC Thaw Plan",
      href: `/stores/${storeNumber}/thaw-plan?location=wic`,
      icon: <Refrigerator />,
    },
    {
      label: "Meat Order Plan",
      href: `/stores/${storeNumber}/order-plan/meat`,
      icon: <Drumstick />,
    },
    {
      label: "Vegetable Order Plan",
      href: `/stores/${storeNumber}/order-plan/vegetables`,
      icon: <Carrot />,
    },
    {
      label: "Container Needs Plan",
      href: `/stores/${storeNumber}/container-plan`,
      icon: <Boxes />,
    },
  ];

  return (
    <section
      aria-labelledby="printables-heading"
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Printer className="size-4" />
        </span>
        <h2 id="printables-heading" className="text-sm font-semibold">
          Printables
        </h2>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2">
        {printables.map((printable, index) => (
          <Link
            key={printable.label}
            href={printable.href}
            className={`group flex min-h-14 items-center gap-3 bg-card px-4 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${index === printables.length - 1 ? "sm:col-span-2" : ""}`}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground [&_svg]:size-4">
              {printable.icon}
            </span>
            <span className="min-w-0 flex-1 font-medium">
              {printable.label}
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}
