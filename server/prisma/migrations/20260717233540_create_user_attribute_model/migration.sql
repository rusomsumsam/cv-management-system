-- CreateTable
CREATE TABLE "UserAttribute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAttribute_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAttribute" ADD CONSTRAINT "UserAttribute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttribute" ADD CONSTRAINT "UserAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
