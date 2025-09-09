/*
  Warnings:

  - You are about to drop the `AppealTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AppealTraining` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelMetrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AppealTemplate";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AppealTraining";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ModelMetrics";
PRAGMA foreign_keys=on;
