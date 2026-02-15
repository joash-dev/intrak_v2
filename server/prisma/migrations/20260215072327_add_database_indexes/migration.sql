-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "announcements_audience_idx" ON "announcements"("audience");

-- CreateIndex
CREATE INDEX "announcements_createdAt_idx" ON "announcements"("createdAt");

-- CreateIndex
CREATE INDEX "attendance_logs_studentId_idx" ON "attendance_logs"("studentId");

-- CreateIndex
CREATE INDEX "attendance_logs_date_idx" ON "attendance_logs"("date");

-- CreateIndex
CREATE INDEX "attendance_logs_studentId_date_idx" ON "attendance_logs"("studentId", "date");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "company_applications_status_idx" ON "company_applications"("status");

-- CreateIndex
CREATE INDEX "company_applications_companyId_idx" ON "company_applications"("companyId");

-- CreateIndex
CREATE INDEX "document_feedback_documentId_idx" ON "document_feedback"("documentId");

-- CreateIndex
CREATE INDEX "documents_studentId_idx" ON "documents"("studentId");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_uploadedById_idx" ON "documents"("uploadedById");

-- CreateIndex
CREATE INDEX "documents_studentId_status_idx" ON "documents"("studentId", "status");

-- CreateIndex
CREATE INDEX "evaluations_studentId_idx" ON "evaluations"("studentId");

-- CreateIndex
CREATE INDEX "evaluations_evaluatorId_idx" ON "evaluations"("evaluatorId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "partnership_messages_studentId_idx" ON "partnership_messages"("studentId");

-- CreateIndex
CREATE INDEX "qr_tokens_studentId_idx" ON "qr_tokens"("studentId");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "students_companyId_idx" ON "students"("companyId");

-- CreateIndex
CREATE INDEX "students_instructorId_idx" ON "students"("instructorId");

-- CreateIndex
CREATE INDEX "supervisor_feedbacks_studentId_idx" ON "supervisor_feedbacks"("studentId");

-- CreateIndex
CREATE INDEX "supervisor_feedbacks_supervisorId_idx" ON "supervisor_feedbacks"("supervisorId");
