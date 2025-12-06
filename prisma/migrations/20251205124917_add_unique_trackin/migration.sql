/*
  Warnings:

  - A unique constraint covering the columns `[tracking_no]` on the table `three_pl_giga_fedex` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "three_pl_giga_fedex_tracking_no_idx";

-- CreateIndex
CREATE UNIQUE INDEX "three_pl_giga_fedex_tracking_no_key" ON "three_pl_giga_fedex"("tracking_no");
