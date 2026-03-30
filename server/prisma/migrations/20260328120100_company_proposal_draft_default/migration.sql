-- Safe after DRAFT exists (separate migration = separate transaction)
ALTER TABLE "company_proposals" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"CompanyProposalStatus";
