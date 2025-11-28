/*
  Warnings:

  - Added the required column `updated_at` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Google_Auth_Refresh_Token" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Google_Auth_Refresh_Token_id_idx" ON "Google_Auth_Refresh_Token"("id");

-- CreateIndex
CREATE INDEX "Logistics_Shippped_Orders_sku_idx" ON "Logistics_Shippped_Orders"("sku");

-- CreateIndex
CREATE INDEX "Logistics_Shippped_Orders_order_on_market_place_idx" ON "Logistics_Shippped_Orders"("order_on_market_place");

-- CreateIndex
CREATE INDEX "Logistics_Shippped_Orders_status_idx" ON "Logistics_Shippped_Orders"("status");

-- CreateIndex
CREATE INDEX "Logistics_Shippped_Orders_created_at_idx" ON "Logistics_Shippped_Orders"("created_at");

-- CreateIndex
CREATE INDEX "Logistics_Shippped_Orders_status_created_at_idx" ON "Logistics_Shippped_Orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "order_order_on_market_place_idx" ON "order"("order_on_market_place");

-- CreateIndex
CREATE INDEX "order_created_at_idx" ON "order"("created_at");

-- CreateIndex
CREATE INDEX "shipping_company_token_shipping_company_name_idx" ON "shipping_company_token"("shipping_company_name");
