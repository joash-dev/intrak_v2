-- Add emergency contact fields to users
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "emergencyName" TEXT;

