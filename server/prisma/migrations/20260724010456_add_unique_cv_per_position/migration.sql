/*
  Warnings:

  - A unique constraint covering the columns `[userId,positionId]` on the table `CV` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CV_userId_positionId_key" ON "CV"("userId", "positionId");
