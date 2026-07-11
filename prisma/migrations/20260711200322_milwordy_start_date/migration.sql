-- Milwordy goals become one-per-user with a settable start date.
-- The single existing dev row keeps its target; startDate defaults to today.
ALTER TABLE "MilwordyGoal" DROP CONSTRAINT "MilwordyGoal_pkey",
DROP COLUMN "year",
ADD COLUMN     "startDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "MilwordyGoal_pkey" PRIMARY KEY ("userId");
