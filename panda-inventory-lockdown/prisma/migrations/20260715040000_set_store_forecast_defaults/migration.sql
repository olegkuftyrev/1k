-- Apply the configured Sunday-through-Saturday defaults to stores that already exist.
UPDATE "Store"
SET "forecastSales" = ARRAY[5107, 5285, 4800, 5839, 5708, 5356, 4482]::INTEGER[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "number" = '1232';

UPDATE "Store"
SET "forecastSales" = ARRAY[7184, 6380, 6920, 6439, 7667, 8316, 6667]::INTEGER[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "number" = '1649';

UPDATE "Store"
SET "forecastSales" = ARRAY[7415, 5563, 7700, 7414, 7918, 8041, 6445]::INTEGER[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "number" = '1650';

UPDATE "Store"
SET "forecastSales" = ARRAY[10103, 10046, 10167, 11069, 10957, 12528, 11741]::INTEGER[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "number" = '2261';

UPDATE "Store"
SET "forecastSales" = ARRAY[7182, 6960, 7022, 7576, 7444, 7203, 5491]::INTEGER[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "number" = '2874';

UPDATE "Store"
SET "forecastSales" = ARRAY[6352, 7382, 7192, 7094, 8530, 8537, 7476]::INTEGER[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "number" = '3698';

UPDATE "Store"
SET "forecastSales" = ARRAY[10974, 10565, 10767, 10736, 11123, 10920, 9819]::INTEGER[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "number" = '3829';
