-- CreateTable
CREATE TABLE "PositionApiToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PositionApiToken_tokenHash_key" ON "PositionApiToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PositionApiToken_positionId_key" ON "PositionApiToken"("positionId");

-- CreateIndex
CREATE INDEX "PositionApiToken_createdById_idx" ON "PositionApiToken"("createdById");

-- AddForeignKey
ALTER TABLE "PositionApiToken" ADD CONSTRAINT "PositionApiToken_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionApiToken" ADD CONSTRAINT "PositionApiToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
