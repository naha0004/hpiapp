-- CreateAppealTrainingModel
CREATE TABLE "AppealTraining" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketType" TEXT NOT NULL,
    "circumstances" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "appealLetter" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "successFactors" TEXT,
    "keyArguments" TEXT NOT NULL,
    "legalReferences" TEXT,
    "processingTime" INTEGER NOT NULL,
    "fineAmount" REAL NOT NULL,
    "fineReduction" REAL,
    "dateSubmitted" DATETIME NOT NULL,
    "dateResolved" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateAppealTemplateModel
CREATE TABLE "AppealTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketType" TEXT NOT NULL UNIQUE,
    "template" TEXT NOT NULL,
    "successRate" REAL NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL,
    "lastUsed" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateModelMetricsModel
CREATE TABLE "ModelMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "successfulAppeals" INTEGER NOT NULL DEFAULT 0,
    "averageSuccessRate" REAL NOT NULL DEFAULT 0,
    "commonSuccessFactors" TEXT NOT NULL,
    "averageFineReduction" REAL NOT NULL DEFAULT 0,
    "typicalProcessingTime" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
