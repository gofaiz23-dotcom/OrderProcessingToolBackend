-- CreateTable
CREATE TABLE "three_pl_giga_fedex" (
    "id" SERIAL NOT NULL,
    "tracking_no" TEXT NOT NULL,
    "fedex_json" JSONB NOT NULL,
    "upload_array" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "three_pl_giga_fedex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "three_pl_giga_fedex_tracking_no_idx" ON "three_pl_giga_fedex"("tracking_no");

-- CreateIndex
CREATE INDEX "three_pl_giga_fedex_created_at_idx" ON "three_pl_giga_fedex"("created_at");
