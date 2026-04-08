-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED');

-- CreateTable
CREATE TABLE "deadline_configs" (
    "id" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "endTime" TEXT NOT NULL,
    "notifications" JSONB NOT NULL,
    "status" "DeadlineStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deadline_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deadline_configs_costCenterId_idx" ON "deadline_configs"("costCenterId");

-- AddForeignKey
ALTER TABLE "deadline_configs" ADD CONSTRAINT "deadline_configs_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
