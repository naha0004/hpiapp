-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subscriptionType" TEXT NOT NULL DEFAULT 'FREE_TRIAL',
    "subscriptionStart" DATETIME,
    "subscriptionEnd" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appealTrialUsed" BOOLEAN NOT NULL DEFAULT false,
    "appealTrialUsedAt" DATETIME,
    "appealTrialReg" TEXT
);
INSERT INTO "new_User" ("address", "createdAt", "email", "emailVerified", "id", "image", "isActive", "name", "password", "phone", "subscriptionEnd", "subscriptionStart", "subscriptionType", "updatedAt") SELECT "address", "createdAt", "email", "emailVerified", "id", "image", "isActive", "name", "password", "phone", "subscriptionEnd", "subscriptionStart", "subscriptionType", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
