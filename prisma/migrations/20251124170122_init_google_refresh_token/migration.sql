-- CreateTable
CREATE TABLE "Google_Auth_Refresh_Token" (
    "id" SERIAL NOT NULL,
    "refresh_token" TEXT NOT NULL,

    CONSTRAINT "Google_Auth_Refresh_Token_pkey" PRIMARY KEY ("id")
);
