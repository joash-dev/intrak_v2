-- CreateTable
CREATE TABLE "agency_self_evaluations" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "unitDivision" TEXT,
    "age" TEXT,
    "sex" TEXT,
    "communicationConnectivity" INTEGER NOT NULL,
    "communicationDialogue" INTEGER NOT NULL,
    "communicationParticipation" INTEGER NOT NULL,
    "ethicalReputation" INTEGER NOT NULL,
    "ethicalCSR" INTEGER NOT NULL,
    "ethicalSupport" INTEGER NOT NULL,
    "psuSupervisorQualified" INTEGER NOT NULL,
    "psuSupportActivities" INTEGER NOT NULL,
    "psuFacilities" INTEGER NOT NULL,
    "hteSupervision" INTEGER NOT NULL,
    "hteSupervisorQualified" INTEGER NOT NULL,
    "hteFeedback" INTEGER NOT NULL,
    "qualityTimeliness" INTEGER NOT NULL,
    "qualityObjectives" INTEGER NOT NULL,
    "qualityResources" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_self_evaluations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "agency_self_evaluations" ADD CONSTRAINT "agency_self_evaluations_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
