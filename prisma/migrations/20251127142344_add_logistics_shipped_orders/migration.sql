-- CreateTable
CREATE TABLE "Logistics_Shippped_Orders" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "order_on_market_place" TEXT NOT NULL,
    "uploads" TEXT[],
    "orders_jsonb" JSONB NOT NULL,
    "rate_quotes_response_jsonb" JSONB NOT NULL,
    "bol_response_jsonb" JSONB NOT NULL,
    "pickup_response_jsonb" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Logistics_Shippped_Orders_pkey" PRIMARY KEY ("id")
);
