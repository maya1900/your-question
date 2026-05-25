-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "checkInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points" INTEGER NOT NULL,
    "continuousDays" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CheckIn_userId_checkInDate_idx" ON "CheckIn"("userId", "checkInDate");

-- CreateIndex
CREATE INDEX "CheckIn_checkInDate_idx" ON "CheckIn"("checkInDate");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_userId_checkInDate_key" ON "CheckIn"("userId", "checkInDate");
