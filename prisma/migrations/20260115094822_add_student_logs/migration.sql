/*
  Warnings:

  - You are about to drop the `Experiment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Experiment";

-- CreateTable
CREATE TABLE "StudentLog" (
    "id" SERIAL NOT NULL,
    "studentName" TEXT NOT NULL,
    "regNo" TEXT NOT NULL,
    "timeTaken" TEXT NOT NULL,
    "tabSwitches" INTEGER NOT NULL DEFAULT 0,
    "screenShots" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentLog_pkey" PRIMARY KEY ("id")
);
