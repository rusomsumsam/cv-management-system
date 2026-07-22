-- AlterTable
ALTER TABLE "CV" ADD COLUMN     "content" TEXT;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
