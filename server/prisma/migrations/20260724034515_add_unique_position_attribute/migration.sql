/*
  Warnings:

  - A unique constraint covering the columns `[positionId,attributeId]` on the table `PositionAttribute` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PositionAttribute_positionId_attributeId_key" ON "PositionAttribute"("positionId", "attributeId");
