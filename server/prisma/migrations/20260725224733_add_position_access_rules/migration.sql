-- CreateEnum
CREATE TYPE "PositionAccessType" AS ENUM ('PUBLIC', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "AccessRuleLogic" AS ENUM ('ALL', 'ANY');

-- CreateEnum
CREATE TYPE "AccessRuleOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'BEFORE', 'ON_OR_BEFORE', 'AFTER', 'ON_OR_AFTER', 'IS_TRUE', 'IS_FALSE');

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "accessRuleLogic" "AccessRuleLogic" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "accessType" "PositionAccessType" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "PositionAccessRule" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "operator" "AccessRuleOperator" NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionAccessRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PositionAccessRule_positionId_idx" ON "PositionAccessRule"("positionId");

-- CreateIndex
CREATE INDEX "PositionAccessRule_attributeId_idx" ON "PositionAccessRule"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionAccessRule_positionId_attributeId_key" ON "PositionAccessRule"("positionId", "attributeId");

-- AddForeignKey
ALTER TABLE "PositionAccessRule" ADD CONSTRAINT "PositionAccessRule_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionAccessRule" ADD CONSTRAINT "PositionAccessRule_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
