# AI Features User Guide

This guide explains how to use the AI-powered features in the INTRAK OJT Management System.

## Quick Start

The AI features are now integrated into your system. You'll see **"Generate with AI"** buttons next to text fields where AI can help you.

## How to Use AI Features

### 1. Supervisor: Evaluation Remarks Generation

**Where to find it:**
- Navigate to **Evaluations** section
- Select a student to evaluate
- Fill out the evaluation form

**How to use:**
1. Select a rating (1-5) for any competency
2. Click the **"Generate with AI"** button next to the Remarks field
3. Wait a few seconds for AI to generate professional remarks
4. Review and edit the generated remarks if needed
5. Continue with other competencies

**What AI considers:**
- The rating you selected
- Competency criteria
- Student's attendance history
- Document submission patterns
- Overall performance

**Example:**
- Rating: 4/5 for "Work Attitude"
- AI generates: "The student demonstrates a positive work attitude and accepts assignments without complaint. Communication with team members is effective, and attendance is regular with minimal tardiness. Overall performance shows good professionalism and cooperation."

---

### 2. Instructor/Coordinator: Document Feedback

**Where to find it:**
- Navigate to **Documents** section
- Click **Approve** or **Reject** on any pending document
- A modal will appear with a feedback field

**How to use:**
1. Click **Approve** or **Reject** on a document
2. In the feedback modal, click **"Generate with AI"** button
3. AI will generate appropriate feedback:
   - **For Approvals**: Positive, encouraging feedback
   - **For Rejections**: Constructive criticism with improvement suggestions
4. Review and edit the feedback
5. Submit your review

**What AI considers:**
- Document type
- Student's submission history
- Approval/rejection context
- Professional tone requirements

**Example (Approval):**
- "Excellent work on your Weekly Report! The submission is well-structured and demonstrates thorough understanding of the week's activities. Keep up the great work!"

**Example (Rejection):**
- "This document needs some improvements before approval. Please ensure all required sections are completed and add more detail to the tasks accomplished section. Resubmit when ready."

---

### 3. Instructor: Attendance Verification Notes

**Where to find it:**
- Navigate to **Attendance Verification** section
- Click **Verify** or **Reject** on any attendance log
- A modal will appear with a notes field

**How to use:**
1. Click **Verify** or **Reject** on an attendance log
2. In the verification modal, click **"Generate with AI"** button
3. AI will generate a professional verification note
4. Review and edit if needed
5. Submit verification

**What AI considers:**
- Time in/out
- Location data
- Student's attendance history
- Verification action (approve/reject)

**Example (Approval):**
- "Attendance verified and approved for the specified time period."

**Example (Rejection):**
- "Attendance rejected due to missing time-out record. Please ensure complete attendance logs are submitted."

---

### 4. Student: Weekly Report Summary

**Where to find it:**
- Navigate to **Reports** section
- Open your Weekly Report
- Fill in tasks accomplished and knowledge/skills learned

**How to use:**
1. Enter your tasks accomplished (can be brief bullet points)
2. Enter knowledge/skills gained
3. Click **"Generate with AI"** button next to the Knowledge/Skills field
4. AI will expand your notes into a professional summary
5. Review and edit the generated summary
6. Save your report

**What AI does:**
- Expands brief notes into professional paragraphs
- Synthesizes tasks and learning outcomes
- Uses academic/professional language
- Creates a cohesive narrative

**Example:**
- **Input**: "Learned Python, worked on database, attended meetings"
- **AI Output**: "This week, I gained hands-on experience with Python programming and database management. I actively participated in team meetings, which enhanced my understanding of project workflows and collaborative development processes. The practical application of these skills has significantly contributed to my professional growth."

---

## Tips for Best Results

### ✅ Do's:
- **Review AI-generated content** - Always check and edit if needed
- **Provide context** - The more information you provide, the better the results
- **Use for inspiration** - AI can help you get started, then customize
- **Edit freely** - All AI-generated content is fully editable

### ❌ Don'ts:
- **Don't rely blindly** - Always review AI output for accuracy
- **Don't skip editing** - AI helps but you should personalize the content
- **Don't use for sensitive data** - Be mindful of what information you're sending

---

## Understanding AI Responses

### Response Time:
- **Fast**: Usually 1-3 seconds
- **Slow**: May take 5-10 seconds during peak times
- **Error**: If it fails, try again after a few seconds

### Quality:
- **Professional tone**: AI generates formal, appropriate content
- **Context-aware**: Considers student data and history
- **Editable**: You can modify everything AI generates

### Limitations:
- **Rate limiting**: 5 requests per minute per user
- **Token limits**: Very long prompts may be truncated
- **Accuracy**: Always review for factual correctness

---

## Troubleshooting

### "Generate with AI" button doesn't appear:
- ✅ Check that you've selected a rating (for evaluations)
- ✅ Ensure you're logged in with the correct role
- ✅ Verify AI is enabled in server configuration

### AI generates empty text:
- ✅ Check your `.env` file has `AI_MAX_TOKENS=1000` or higher
- ✅ Verify your API key is correct
- ✅ Check server logs for errors

### "Too many requests" error:
- ✅ Wait 1 minute and try again
- ✅ The system limits to 5 requests per minute
- ✅ This prevents abuse and controls costs

### AI generates irrelevant content:
- ✅ Provide more context in your inputs
- ✅ Try regenerating (click the button again)
- ✅ Edit the generated content to match your needs

### API key errors:
- ✅ Verify your API key in `.env` file
- ✅ Check that `AI_ENABLED=true`
- ✅ Ensure your API key has proper permissions
- ✅ For Gemini: Check you've enabled the API in Google Cloud Console

---

## Cost Awareness

### Free Tier (Gemini):
- 15 requests per minute
- Generous free usage for testing

### Paid Usage:
- Very affordable (around $0.04 per 100 requests)
- Monitor usage in your provider's dashboard
- Set budget alerts if needed

### Best Practices:
- Use AI for important evaluations, not every single field
- Review before regenerating (saves tokens)
- Edit generated content rather than regenerating multiple times

---

## Examples by Role

### Supervisor Workflow:
1. Open student evaluation
2. Rate competencies (1-5)
3. Click "Generate with AI" for each competency's remarks
4. Review and customize remarks
5. Submit evaluation

### Instructor Workflow:
1. Review pending documents
2. Click Approve/Reject
3. Click "Generate with AI" for feedback
4. Review and submit

### Student Workflow:
1. Fill weekly report with brief notes
2. Click "Generate with AI" to expand summary
3. Review and refine
4. Save report

---

## Need Help?

- **Technical Issues**: Check server logs and error messages
- **API Problems**: Verify your API key and provider settings
- **Quality Issues**: Try regenerating or provide more context
- **Feature Requests**: Contact your system administrator

---

## Quick Reference

| Feature | Location | Button Location | When to Use |
|---------|----------|----------------|-------------|
| Evaluation Remarks | Supervisor → Evaluations | Next to Remarks field | After selecting a rating |
| Document Feedback | Instructor/Coordinator → Documents | In review modal | When approving/rejecting |
| Attendance Notes | Instructor → Attendance | In verification modal | When verifying attendance |
| Report Summary | Student → Reports | Next to Knowledge/Skills | After entering tasks |

---

**Remember**: AI is a tool to help you, not replace your judgment. Always review and customize AI-generated content to ensure it accurately reflects your evaluation and feedback.

