-- Speed up public question lists, profile pages, and detail-page relation lookups.
CREATE INDEX IF NOT EXISTS "Question_hiddenAt_createdAt_idx" ON "Question"("hiddenAt", "createdAt");
CREATE INDEX IF NOT EXISTS "Question_hiddenAt_acceptedAnswerId_createdAt_idx" ON "Question"("hiddenAt", "acceptedAnswerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Question_authorId_hiddenAt_createdAt_idx" ON "Question"("authorId", "hiddenAt", "createdAt");
CREATE INDEX IF NOT EXISTS "Answer_questionId_hiddenAt_createdAt_idx" ON "Answer"("questionId", "hiddenAt", "createdAt");
CREATE INDEX IF NOT EXISTS "Answer_authorId_hiddenAt_createdAt_idx" ON "Answer"("authorId", "hiddenAt", "createdAt");
CREATE INDEX IF NOT EXISTS "User_isActive_score_idx" ON "User"("isActive", "score");
