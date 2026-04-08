-- CreateEnum
CREATE TYPE "DataStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "indicator_variables" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicator_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicator_data" (
    "id" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "costCenterCode" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "values" JSONB NOT NULL,
    "status" "DataStatus" NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicator_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indicator_data_variableId_costCenterId_year_key" ON "indicator_data"("variableId", "costCenterId", "year");

-- AddForeignKey
ALTER TABLE "indicator_variables" ADD CONSTRAINT "indicator_variables_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicator_data" ADD CONSTRAINT "indicator_data_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "indicator_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicator_data" ADD CONSTRAINT "indicator_data_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
