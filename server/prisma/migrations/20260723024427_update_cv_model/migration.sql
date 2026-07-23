/*
  Warnings:

  - You are about to drop the column `content` on the `CV` table. All the data in the column will be lost.
  - Added the required column `email` to the `CV` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `CV` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CV" DROP COLUMN "content",
ADD COLUMN     "education" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "projects" TEXT,
ADD COLUMN     "skills" TEXT,
ADD COLUMN     "summary" TEXT;
