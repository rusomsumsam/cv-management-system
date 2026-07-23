/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Attribute` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,attributeId]` on the table `UserAttribute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Attribute` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Attribute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `UserAttribute` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('STRING', 'TEXT', 'IMAGE', 'NUMERIC', 'DATE', 'PERIOD', 'BOOLEAN', 'DROPDOWN');

-- AlterTable
ALTER TABLE "Attribute" ADD COLUMN     "category" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "AttributeType" NOT NULL;

-- AlterTable
ALTER TABLE "UserAttribute" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "value" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_name_key" ON "Attribute"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserAttribute_userId_attributeId_key" ON "UserAttribute"("userId", "attributeId");
