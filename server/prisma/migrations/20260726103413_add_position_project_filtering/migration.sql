-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "maxProjects" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "PositionTag" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PositionTag_positionId_idx" ON "PositionTag"("positionId");

-- CreateIndex
CREATE INDEX "PositionTag_tagId_idx" ON "PositionTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionTag_positionId_tagId_key" ON "PositionTag"("positionId", "tagId");

-- AddForeignKey
ALTER TABLE "PositionTag" ADD CONSTRAINT "PositionTag_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionTag" ADD CONSTRAINT "PositionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
