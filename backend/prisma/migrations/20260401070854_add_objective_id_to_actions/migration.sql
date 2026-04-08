-- AlterTable
ALTER TABLE "strategic_actions" ADD COLUMN     "objectiveId" TEXT;

-- AddForeignKey
ALTER TABLE "strategic_actions" ADD CONSTRAINT "strategic_actions_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "strategic_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;
