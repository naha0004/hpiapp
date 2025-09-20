-- AlterTable
ALTER TABLE "Appeal" ADD COLUMN "n244Form" TEXT;
ALTER TABLE "Appeal" ADD COLUMN "pe2Form" TEXT;
ALTER TABLE "Appeal" ADD COLUMN "pe3Form" TEXT;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL,
    "minOrderValue" REAL,
    "maxDiscount" REAL,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER,
    "validFrom" DATETIME NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicableFor" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PromoUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,
    "orderValue" REAL NOT NULL,
    "discountAmount" REAL NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromoUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromoUsage_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "amount" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "finalAmount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "promoCodeUsed" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "currency", "description", "id", "status", "stripePaymentId", "type", "updatedAt", "userId") SELECT "amount", "createdAt", "currency", "description", "id", "status", "stripePaymentId", "type", "updatedAt", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");
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
    "appealTrialReg" TEXT,
    "hpiCredits" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("address", "appealTrialReg", "appealTrialUsed", "appealTrialUsedAt", "createdAt", "email", "emailVerified", "id", "image", "isActive", "name", "password", "phone", "subscriptionEnd", "subscriptionStart", "subscriptionType", "updatedAt") SELECT "address", "appealTrialReg", "appealTrialUsed", "appealTrialUsedAt", "createdAt", "email", "emailVerified", "id", "image", "isActive", "name", "password", "phone", "subscriptionEnd", "subscriptionStart", "subscriptionType", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_validFrom_validUntil_idx" ON "PromoCode"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode"("isActive");

-- CreateIndex
CREATE INDEX "PromoUsage_promoCodeId_idx" ON "PromoUsage"("promoCodeId");

-- CreateIndex
CREATE INDEX "PromoUsage_userId_idx" ON "PromoUsage"("userId");

-- CreateIndex
CREATE INDEX "PromoUsage_paymentId_idx" ON "PromoUsage"("paymentId");
