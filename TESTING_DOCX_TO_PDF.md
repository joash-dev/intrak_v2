# How to Test DOCX to PDF Conversion in Your System

## Quick Test Steps

### Step 1: Make Sure Server is Running
- Open terminal in your project
- Go to `server` folder
- Run: `npm run dev`
- Make sure it's running without errors

### Step 2: Make Sure Client is Running
- Open another terminal
- Go to `client` folder  
- Run: `npm run dev`
- Open browser to your app URL (usually `http://localhost:5173`)

### Step 3: Login as Supervisor
1. Login with a **Supervisor account**
2. Navigate to **"Evaluation"** page/tab
3. You should see the list of students/interns

### Step 4: Submit an Evaluation
1. Click on **"Form 11 - Internship Evaluation"** tab (should be active by default)
2. Find a student in the list
3. Click **"Start Evaluation"** button on that student
4. Fill out the evaluation form:
   - Rate ALL 8 competency categories (1-5 stars each)
   - You can add optional remarks
5. Click **"Submit Evaluation"** button
6. You should see a success message: "Evaluation submitted for [Student Name]"

### Step 5: Check if PDF was Generated
**Option A: Check Server Console/Logs**
- Look at your server terminal
- Check for any error messages
- If successful, you should see the evaluation was saved

**Option B: Check Database**
- Open your database (Prisma Studio or database tool)
- Check the `documents` table
- Look for a new document with:
  - `type = 'INTERNSHIP_EVALUATION'`
  - `mimeType = 'application/pdf'`
  - `status = 'APPROVED'`

**Option C: Check File System**
- Go to: `server/uploads/documents/{studentId}/`
- Look for a PDF file named like: `InternshipEvaluation_{student_name}.pdf`

### Step 6: Test Student Preview (Most Important!)
1. **Logout** from Supervisor account
2. **Login** as the **Student** that was evaluated
3. Go to **"Evaluation"** tab
4. You should see **"Form 11 - Internship Evaluation Form"** card
5. Click **"Preview"** button
6. A modal should open showing the **PDF preview**
7. The PDF should:
   - Match the DOCX template format
   - Show all filled-in data (student name, company, ratings, etc.)
   - Look professional and properly formatted

## What to Look For

### ✅ Success Signs:
- Evaluation submits without errors
- Success toast message appears
- PDF appears in student's evaluation tab
- PDF preview shows correctly formatted document
- All data is filled in correctly

### ❌ Error Signs:
- Error message when submitting
- "PDF not available yet" message in student view
- Server console shows LibreOffice errors
- No PDF file in documents folder

## Troubleshooting

### If PDF doesn't generate:
1. **Check LibreOffice Installation:**
   - LibreOffice must be installed on your server machine
   - Windows: Usually at `C:\Program Files\LibreOffice\program\soffice.exe`
   - If installed elsewhere, you may need to update the code

2. **Check Server Logs:**
   - Look for error messages in server console
   - Common errors:
     - "LibreOffice not found" → Need to install LibreOffice
     - "Conversion timeout" → LibreOffice taking too long
     - "Permission denied" → Check file/folder permissions

3. **Check Template File:**
   - Make sure `server/src/templates/11 INTERNSHIP EVALUATION FORM_2024.docx` exists
   - Template should have proper placeholders like `${student_name}`, `${company_name}`, etc.

### If you see "PDF not available yet":
- The PDF generation failed silently
- Check server logs for errors
- Verify LibreOffice is installed and accessible

### Method 2: Test via API Directly

1. **Submit evaluation via API:**
   ```bash
   curl -X POST http://localhost:5000/api/evaluations \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "studentId": "student_id_here",
       "overallRating": 4.5,
       "competencies": {
         "abilityToLearn": { "rating": 5 },
         "workAttitude": { "rating": 4 },
         "conduct": { "rating": 5 },
         "motivationInitiative": { "rating": 4 },
         "qualityAccuracy": { "rating": 5 },
         "quantityOfWork": { "rating": 4 },
         "safetyPractices": { "rating": 5 },
         "appearanceHygiene": { "rating": 4 }
       }
     }'
   ```

2. **Check response:**
   - Should return `201 Created` with evaluation data
   - Check server logs for PDF generation status

3. **Verify PDF was created:**
   - Check database for document with `type: 'INTERNSHIP_EVALUATION'`
   - Check file system: `server/uploads/documents/{studentId}/`

### Method 3: Test Export Function

1. **Export evaluation form:**
   - In Supervisor UI, after submitting evaluation
   - Click "Export Official Form" button
   - Should download DOCX file
   - PDF should also be generated and saved automatically

## What to Check

### ✅ Success Indicators

1. **Server Logs:**
   - No LibreOffice errors
   - PDF file created successfully
   - Document record created in database

2. **Database:**
   ```sql
   SELECT * FROM documents 
   WHERE type = 'INTERNSHIP_EVALUATION' 
   AND studentId = 'your_student_id'
   ORDER BY createdAt DESC;
   ```
   - Should see a new document record
   - `status` should be `'APPROVED'`
   - `mimeType` should be `'application/pdf'`

3. **File System:**
   - Check: `server/uploads/documents/{studentId}/`
   - Should see a PDF file with name like `InternshipEvaluation_{student_name}.pdf`
   - File should be readable and properly formatted

4. **Student UI:**
   - Form 11 should show "Preview" button
   - Clicking preview should display the PDF in a modal
   - PDF should match the DOCX template format

### ❌ Common Issues & Solutions

#### Issue 1: "LibreOffice not found" error

**Solution:**
- Verify LibreOffice is installed
- Check if the path in code matches your installation
- Add custom path to `libreOfficeCommands` array in code

#### Issue 2: PDF generation timeout

**Solution:**
- Increase timeout in code (currently 30 seconds)
- Check server resources (CPU, memory)
- Ensure temp directory has write permissions

#### Issue 3: PDF file not created

**Solution:**
- Check temp directory: `server/uploads/temp/`
- Verify file permissions
- Check server logs for specific error messages
- Ensure LibreOffice can write to output directory

#### Issue 4: PDF format doesn't match template

**Solution:**
- Verify template file exists: `server/src/templates/11 INTERNSHIP EVALUATION FORM_2024.docx`
- Check template placeholders match code
- Test template manually in LibreOffice

## Debugging

### Enable Detailed Logging

Add console logs in `generateEvaluationPDFFromDocx` function:

```typescript
console.log('Temp DOCX path:', tempDocxPath);
console.log('Temp PDF path:', tempPdfPath);
console.log('LibreOffice command:', command);
console.log('Conversion result:', conversionSuccess);
```

### Check Temp Files

After testing, check temp directory:
```bash
# Windows
dir server\uploads\temp\

# Linux/Mac
ls -la server/uploads/temp/
```

Temp files should be automatically cleaned up, but if conversion fails, they may remain.

### Manual Conversion Test

Test LibreOffice conversion manually:

**Windows:**
```powershell
& "C:\Program Files\LibreOffice\program\soffice.exe" --headless --convert-to pdf --outdir "C:\temp" "path\to\test.docx"
```

**Linux:**
```bash
soffice --headless --convert-to pdf --outdir /tmp /path/to/test.docx
```

## Expected Behavior

1. **On Evaluation Submit:**
   - Evaluation saved to database ✅
   - DOCX template filled with data ✅
   - DOCX converted to PDF ✅
   - PDF saved to student's document folder ✅
   - Document record created in database ✅
   - Old evaluation PDFs deleted (only latest kept) ✅

2. **On Student Preview:**
   - PDF loads in preview modal ✅
   - PDF format matches original DOCX template ✅
   - All placeholders filled correctly ✅
   - Layout and styling preserved ✅

3. **On Export:**
   - DOCX file downloads ✅
   - PDF also generated and saved ✅
   - Both files use same template ✅

## Verification Checklist

- [ ] LibreOffice installed and accessible
- [ ] Template file exists and is valid
- [ ] Evaluation submission creates PDF
- [ ] PDF appears in student's evaluation tab
- [ ] PDF format matches DOCX template
- [ ] All data fields are filled correctly
- [ ] No errors in server logs
- [ ] Temp files are cleaned up
- [ ] Old PDFs are replaced with new ones

