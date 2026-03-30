-- Add enum value only (must commit before using in same migration — see next migration)
ALTER TYPE "CompanyProposalStatus" ADD VALUE 'DRAFT';
