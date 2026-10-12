-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "AIMessage" ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "outputTokens" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "PlatformRole" NOT NULL DEFAULT 'USER';
