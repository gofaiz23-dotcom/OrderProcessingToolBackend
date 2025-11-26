-- CreateTable
CREATE TABLE "order" (
    "id" SERIAL NOT NULL,
    "order_on_market_place" TEXT NOT NULL,
    "jsonb" JSONB NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);
