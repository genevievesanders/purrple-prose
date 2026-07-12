-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Entry_userId_slug_key" ON "Entry"("userId", "slug");

