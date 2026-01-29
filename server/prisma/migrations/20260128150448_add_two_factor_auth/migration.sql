-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorCode" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorExpires" TIMESTAMP(3);
