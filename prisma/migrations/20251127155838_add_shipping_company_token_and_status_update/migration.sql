-- CreateTable
CREATE TABLE "shipping_company_token" (
    "id" SERIAL NOT NULL,
    "shipping_company_name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_company_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_company_token_shipping_company_name_key" ON "shipping_company_token"("shipping_company_name");
