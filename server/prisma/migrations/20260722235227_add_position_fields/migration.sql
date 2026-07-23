-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "company" TEXT,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "location" TEXT;
