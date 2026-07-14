import { describe, expect, it } from "vitest";
import {
  BASE_SALES,
  calculateOrder,
  casesForTarget,
  casesPer1k,
} from "../src/lib/ordering/calculate";

describe("casesPer1k", () => {
  it("divides usage by units per case", () => {
    // Orange Chicken: 18.3 LB/$1k ÷ 40 LB/case.
    expect(casesPer1k(18.3, 40)).toBeCloseTo(0.4575, 6);
  });

  it("returns null when usage is missing", () => {
    expect(casesPer1k(null, 40)).toBeNull();
  });

  it("returns null when units-per-case is missing", () => {
    expect(casesPer1k(18.3, null)).toBeNull();
  });

  it("returns null for non-positive units-per-case", () => {
    expect(casesPer1k(18.3, 0)).toBeNull();
    expect(casesPer1k(18.3, -5)).toBeNull();
  });
});

describe("casesForTarget", () => {
  it("scales cases-per-$1k by the sales target", () => {
    // 0.4575 cases/$1k × ($22,000 / 1000) = 10.065.
    expect(casesForTarget(18.3, 40, 22000)).toBeCloseTo(10.065, 3);
  });

  it("equals casesPer1k at the base sales figure", () => {
    expect(casesForTarget(2.42, 30, BASE_SALES)).toBeCloseTo(
      casesPer1k(2.42, 30)!,
      6,
    );
  });

  it("propagates null for incomplete inputs", () => {
    expect(casesForTarget(null, 40, 22000)).toBeNull();
  });
});

describe("calculateOrder", () => {
  it("returns projection only when no on-hand count is given", () => {
    const r = calculateOrder({
      averagePer1k: 18.3,
      unitsPerCase: 40,
      salesTarget: 22000,
    });
    expect(r.casesPer1k).toBeCloseTo(0.4575, 6);
    expect(r.casesNeeded).toBeCloseTo(10.065, 3);
    expect(r.orderCases).toBeCloseTo(10.065, 3);
  });

  it("subtracts on-hand cases from the need", () => {
    const r = calculateOrder({
      averagePer1k: 18.3,
      unitsPerCase: 40,
      salesTarget: 22000,
      onHandCases: 4,
    });
    expect(r.orderCases).toBeCloseTo(6.065, 3);
  });

  it("never returns a negative order", () => {
    const r = calculateOrder({
      averagePer1k: 18.3,
      unitsPerCase: 40,
      salesTarget: 22000,
      onHandCases: 20,
    });
    expect(r.orderCases).toBe(0);
  });

  it("rounds the order up to whole cases when requested", () => {
    const r = calculateOrder({
      averagePer1k: 18.3,
      unitsPerCase: 40,
      salesTarget: 22000,
      onHandCases: 4,
      roundUp: true,
    });
    // 6.065 → 7.
    expect(r.orderCases).toBe(7);
  });

  it("returns null order when inputs are incomplete", () => {
    const r = calculateOrder({
      averagePer1k: null,
      unitsPerCase: 40,
      salesTarget: 22000,
    });
    expect(r.casesNeeded).toBeNull();
    expect(r.orderCases).toBeNull();
  });
});
