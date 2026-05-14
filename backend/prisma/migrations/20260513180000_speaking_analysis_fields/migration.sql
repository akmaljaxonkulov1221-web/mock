-- AlterTable: structured speaking analysis + CEFR (Groq pipeline)
ALTER TABLE "speaking_records" ADD COLUMN IF NOT EXISTS "estimatedSpeakingCefr" TEXT;
ALTER TABLE "speaking_records" ADD COLUMN IF NOT EXISTS "pronunciationAnalysis" JSONB;
ALTER TABLE "speaking_records" ADD COLUMN IF NOT EXISTS "fluencyAnalysis" JSONB;
