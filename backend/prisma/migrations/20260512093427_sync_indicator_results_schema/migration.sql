ALTER TABLE "indicator_results"
  ADD COLUMN IF NOT EXISTS "planId" TEXT,
  ADD COLUMN IF NOT EXISTS "objectiveId" TEXT,
  ADD COLUMN IF NOT EXISTS "actionId" TEXT,
  ADD COLUMN IF NOT EXISTS "expectedValue" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "obtainedValue" DOUBLE PRECISION;

UPDATE "indicator_results" AS ir
SET
  "planId" = i."planId",
  "objectiveId" = i."objectiveId",
  "actionId" = i."actionId",
  "expectedValue" = COALESCE(iv."value", ir."value", 0),
  "obtainedValue" = COALESCE(ir."obtainedValue", ir."value")
FROM "indicators" AS i
LEFT JOIN "indicator_values" AS iv
  ON iv."indicatorId" = ir."indicatorId"
 AND iv."year" = ir."year"
WHERE i."id" = ir."indicatorId";

ALTER TABLE "indicator_results"
  ALTER COLUMN "planId" SET NOT NULL,
  ALTER COLUMN "expectedValue" SET NOT NULL;

DROP INDEX IF EXISTS "indicator_results_indicatorId_year_key";

CREATE UNIQUE INDEX IF NOT EXISTS "indicator_results_planId_indicatorId_year_key"
  ON "indicator_results"("planId", "indicatorId", "year");

ALTER TABLE "indicator_results"
  DROP COLUMN IF EXISTS "value",
  DROP COLUMN IF EXISTS "createdBy",
  DROP COLUMN IF EXISTS "updatedBy";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'indicator_results_planId_fkey'
  ) THEN
    ALTER TABLE "indicator_results"
      ADD CONSTRAINT "indicator_results_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "strategic_plans"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'indicator_results_objectiveId_fkey'
  ) THEN
    ALTER TABLE "indicator_results"
      ADD CONSTRAINT "indicator_results_objectiveId_fkey"
      FOREIGN KEY ("objectiveId") REFERENCES "strategic_objectives"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'indicator_results_actionId_fkey'
  ) THEN
    ALTER TABLE "indicator_results"
      ADD CONSTRAINT "indicator_results_actionId_fkey"
      FOREIGN KEY ("actionId") REFERENCES "strategic_actions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'indicator_results_indicatorId_fkey'
  ) THEN
    ALTER TABLE "indicator_results"
      ADD CONSTRAINT "indicator_results_indicatorId_fkey"
      FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
