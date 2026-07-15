import { describe, expect, it } from "vitest";
import {
  defaultDays,
  scheduleDateLabel,
  sumSales,
  type PlannerDays,
} from "../src/lib/planner";

const MWF = [1, 3, 5];

describe("defaultDays", () => {
  it("marks the given delivery days and applies default sales", () => {
    const days = defaultDays(MWF, 5000);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.delivery)).toEqual([
      false, true, false, true, false, true, false,
    ]);
    expect(days.every((d) => d.sales === 5000)).toBe(true);
  });
});

describe("sumSales", () => {
  it("adds up forecasted sales for only the manually selected days", () => {
    const days: PlannerDays = defaultDays(MWF, 0);
    days[3].sales = 4000;
    days[4].sales = 5000;
    days[5].sales = 9000;
    expect(sumSales(days, [3, 4])).toBe(9000);
  });
});

describe("scheduleDateLabel", () => {
  const tuesday = new Date(2026, 6, 14, 12);

  it("labels the current weekday as Today", () => {
    expect(scheduleDateLabel(2, tuesday)).toBe("Today");
  });

  it("maps the rest of the Monday-first week to calendar dates", () => {
    expect(scheduleDateLabel(1, tuesday)).toBe("July 13");
    expect(scheduleDateLabel(3, tuesday)).toBe("July 15");
    expect(scheduleDateLabel(0, tuesday)).toBe("July 19");
  });
});
