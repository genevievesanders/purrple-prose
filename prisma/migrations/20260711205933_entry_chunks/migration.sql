-- CreateTable
CREATE TABLE "EntryChunk" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,

    CONSTRAINT "EntryChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntryChunk_userId_idx" ON "EntryChunk"("userId");

-- CreateIndex
CREATE INDEX "EntryChunk_entryId_idx" ON "EntryChunk"("entryId");

-- AddForeignKey
ALTER TABLE "EntryChunk" ADD CONSTRAINT "EntryChunk_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
