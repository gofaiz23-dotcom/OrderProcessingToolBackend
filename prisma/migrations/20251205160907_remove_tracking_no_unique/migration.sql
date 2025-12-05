-- DropIndex
DROP INDEX "three_pl_giga_fedex_tracking_no_key";

-- CreateIndex
CREATE INDEX "three_pl_giga_fedex_tracking_no_idx" ON "three_pl_giga_fedex"("tracking_no");
