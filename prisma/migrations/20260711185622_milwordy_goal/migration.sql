-- CreateTable
CREATE TABLE "MilwordyGoal" (
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "targetWords" INTEGER NOT NULL DEFAULT 1000000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilwordyGoal_pkey" PRIMARY KEY ("userId","year")
);

-- AddForeignKey
ALTER TABLE "MilwordyGoal" ADD CONSTRAINT "MilwordyGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
