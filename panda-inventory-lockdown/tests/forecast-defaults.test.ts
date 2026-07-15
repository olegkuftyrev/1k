import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ForecastSalesMapSchema } from "../src/lib/schema";

async function loadForecastDefaults() {
  const raw = JSON.parse(
    await readFile(resolve("data/forecast-sales.json"), "utf8"),
  );
  return ForecastSalesMapSchema.parse(
    Object.fromEntries(
      Object.entries(raw).filter(([key]) => !key.startsWith("_")),
    ),
  );
}

describe("forecast defaults", () => {
  it("stores every week Sunday-first", async () => {
    const forecasts = await loadForecastDefaults();

    expect(forecasts["1232"]).toEqual([
      5107, 5285, 4800, 5839, 5708, 5356, 4482,
    ]);
    expect(forecasts["3829"]).toEqual([
      10974, 10565, 10767, 10736, 11123, 10920, 9819,
    ]);
    expect(Object.values(forecasts).every((week) => week.length === 7)).toBe(
      true,
    );
  });
});
