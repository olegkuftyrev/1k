import { describe, expect, it } from "vitest";
import {
  coverageWindow,
  defaultDays,
  deliveryDayList,
  firstDeliveryDay,
  orderDaySet,
  preDeliveryWindow,
  sumSales,
  upcomingDeliveryDay,
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

describe("deliveryDayList", () => {
  it("returns sorted delivery day indices", () => {
    expect(deliveryDayList(defaultDays(MWF))).toEqual([1, 3, 5]);
  });
});

describe("orderDaySet", () => {
  it("marks the day two days before each delivery", () => {
    // Mon(1)->Sat(6), Wed(3)->Mon(1), Fri(5)->Wed(3)
    const set = orderDaySet(defaultDays(MWF));
    expect([...set].sort((a, b) => a - b)).toEqual([1, 3, 6]);
  });
});

describe("coverageWindow", () => {
  const days = defaultDays(MWF);

  it("covers from the delivery until the next delivery", () => {
    expect(coverageWindow(days, 3)).toEqual([3, 4]); // Wed -> Wed,Thu
    expect(coverageWindow(days, 1)).toEqual([1, 2]); // Mon -> Mon,Tue
  });

  it("wraps across the weekend", () => {
    expect(coverageWindow(days, 5)).toEqual([5, 6, 0]); // Fri -> Fri,Sat,Sun
  });

  it("returns the whole week for a single delivery day", () => {
    const single = defaultDays([3]);
    expect(coverageWindow(single, 3)).toEqual([3, 4, 5, 6, 0, 1, 2]);
  });

  it("returns nothing for a non-delivery day", () => {
    expect(coverageWindow(days, 2)).toEqual([]);
  });
});

describe("sumSales", () => {
  it("adds up projected sales across the window", () => {
    const days: PlannerDays = defaultDays(MWF, 0);
    days[3].sales = 4000;
    days[4].sales = 5000;
    expect(sumSales(days, coverageWindow(days, 3))).toBe(9000);
  });
});

describe("upcomingDeliveryDay", () => {
  it("chooses the next delivery with enough order lead time", () => {
    const days = defaultDays(MWF);
    expect(upcomingDeliveryDay(days, 2)).toBe(5); // Tue -> Fri
    expect(upcomingDeliveryDay(days, 3)).toBe(5); // Wed -> Fri
    expect(upcomingDeliveryDay(days, 4)).toBe(1); // Thu -> next Mon
  });

  it("returns null when there are no delivery days", () => {
    expect(upcomingDeliveryDay(defaultDays([]), 2)).toBeNull();
  });
});

describe("preDeliveryWindow", () => {
  it("includes today through the day before delivery", () => {
    expect(preDeliveryWindow(5, 3)).toEqual([3, 4]); // Wed before Fri
    expect(preDeliveryWindow(1, 6)).toEqual([6, 0]); // Sat before Mon
  });

  it("returns no days when delivery is today", () => {
    expect(preDeliveryWindow(3, 3)).toEqual([]);
  });
});

describe("firstDeliveryDay", () => {
  it("returns the first delivery in Monday-first order", () => {
    expect(firstDeliveryDay(defaultDays(MWF))).toBe(1);
    expect(firstDeliveryDay(defaultDays([0, 5]))).toBe(5); // Fri before Sun
    expect(firstDeliveryDay(defaultDays([]))).toBeNull();
  });
});
