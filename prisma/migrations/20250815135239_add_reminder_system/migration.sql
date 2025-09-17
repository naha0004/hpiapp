-- CreateTable
CREATE TABLE "VehicleReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vehicleReg" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "notifyDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleReminderNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reminderId" TEXT NOT NULL,
    "notifyDate" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "method" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "message" TEXT,
    "emailTo" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailError" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleReminderNotification_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "VehicleReminder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vehicleReg" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dvlaData" JSONB,
    "dvsaData" JSONB,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" DATETIME,
    "acceptedAt" DATETIME,
    "createdReminderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VehicleReminder_userId_idx" ON "VehicleReminder"("userId");

-- CreateIndex
CREATE INDEX "VehicleReminder_vehicleReg_idx" ON "VehicleReminder"("vehicleReg");

-- CreateIndex
CREATE INDEX "VehicleReminder_dueDate_idx" ON "VehicleReminder"("dueDate");

-- CreateIndex
CREATE INDEX "VehicleReminder_reminderType_idx" ON "VehicleReminder"("reminderType");

-- CreateIndex
CREATE INDEX "VehicleReminder_isActive_idx" ON "VehicleReminder"("isActive");

-- CreateIndex
CREATE INDEX "VehicleReminderNotification_reminderId_idx" ON "VehicleReminderNotification"("reminderId");

-- CreateIndex
CREATE INDEX "VehicleReminderNotification_notifyDate_idx" ON "VehicleReminderNotification"("notifyDate");

-- CreateIndex
CREATE INDEX "VehicleReminderNotification_status_idx" ON "VehicleReminderNotification"("status");

-- CreateIndex
CREATE INDEX "VehicleReminderNotification_method_idx" ON "VehicleReminderNotification"("method");

-- CreateIndex
CREATE INDEX "VehicleSuggestion_userId_idx" ON "VehicleSuggestion"("userId");

-- CreateIndex
CREATE INDEX "VehicleSuggestion_vehicleReg_idx" ON "VehicleSuggestion"("vehicleReg");

-- CreateIndex
CREATE INDEX "VehicleSuggestion_suggestionType_idx" ON "VehicleSuggestion"("suggestionType");

-- CreateIndex
CREATE INDEX "VehicleSuggestion_priority_idx" ON "VehicleSuggestion"("priority");

-- CreateIndex
CREATE INDEX "VehicleSuggestion_isDismissed_idx" ON "VehicleSuggestion"("isDismissed");
