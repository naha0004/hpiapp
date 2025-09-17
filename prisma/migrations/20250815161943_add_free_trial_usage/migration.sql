-- CreateTable
CREATE TABLE "FreeTrialUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration" TEXT NOT NULL,
    "userId" TEXT,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "FreeTrialUsage_registration_idx" ON "FreeTrialUsage"("registration");

-- CreateIndex
CREATE INDEX "FreeTrialUsage_userId_idx" ON "FreeTrialUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FreeTrialUsage_registration_key" ON "FreeTrialUsage"("registration");
