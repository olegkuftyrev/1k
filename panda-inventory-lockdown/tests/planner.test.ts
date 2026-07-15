import { describe, expect, it } from "vitest";
import {
  defaultDays,
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
