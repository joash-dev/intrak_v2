/**
 * PDF Generator Service
 * Reads HTML templates, injects form data, and renders PDF via Puppeteer.
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { getStoragePathWithFallback, ensureNASDirectoryExists, createLocalBackup } from '../config/nas';

const TEMPLATES_DIR = path.resolve(__dirname, '../templates/html');

/**
 * Read an HTML template file and replace all ${variable} placeholders.
 */
export function renderTemplate(templateFile: string, data: Record<string, string>): string {
    const filePath = path.join(TEMPLATES_DIR, templateFile);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Template not found: ${templateFile}`);
    }

    let html = fs.readFileSync(filePath, 'utf-8');

    // Replace ${variable} inside <span class="var"> with the actual value, keeping the span wrapper
    // so that .var CSS (bold, color, uppercase, etc.) still applies to rendered values.
    html = html.replace(/<span class="var">\$\{(\w+)\}<\/span>/g, (match, varName) => {
        const value = data[varName];
        if (value !== undefined && value !== null && value !== '') {
            return `<span class="var">${value}</span>`;
        }
        // If no value provided, return empty (the blank line will still show)
        return '&nbsp;';
    });

    // Also handle standalone ${variable} not inside var spans (if any)
    html = html.replace(/\$\{(\w+)\}/g, (match, varName) => {
        const value = data[varName];
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
        return '';
    });

    // Convert asset images to base64 data URIs so they work in both
    // iframe previews and Puppeteer PDF rendering
    const assetsDir = path.join(TEMPLATES_DIR, 'assets');
    html = html.replace(/src="assets\/([^"]+)"/g, (match, filename) => {
        const assetPath = path.join(assetsDir, filename);
        if (fs.existsSync(assetPath)) {
            const ext = path.extname(filename).toLowerCase().replace('.', '');
            const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
            const base64 = fs.readFileSync(assetPath).toString('base64');
            return `src="data:${mimeType};base64,${base64}"`;
        }
        return match;
    });

    return html;
}

/**
 * Render HTML to a preview string (for iframe display).
 */
export function generatePreviewHtml(templateFile: string, data: Record<string, string>): string {
    return renderTemplate(templateFile, data);
}

/**
 * Render HTML to PDF using Puppeteer and save to storage.
 * Returns the saved file path and filename.
 */
export async function generatePdf(
    templateFile: string,
    data: Record<string, string>,
    documentType: string,
    studentId: string
): Promise<{ filepath: string; filename: string; buffer: Buffer }> {
    const html = renderTemplate(templateFile, data);
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

    try {
        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });
        const page = await browser.newPage();

        // Set content and wait for images to load
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 30000,
        });

        // Generate PDF with A4 size matching the template's @page settings
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '6mm',
                right: '10mm',
                bottom: '6mm',
                left: '10mm',
            },
        });

        // Convert Uint8Array to Buffer
        const buffer = Buffer.from(pdfBuffer);

        // Determine storage path
        const { storagePath } = getStoragePathWithFallback();
        const documentsDir = path.join(storagePath, 'documents', studentId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/46b30d57-8d19-4b14-963d-edda67b1b958',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'finalize-500-investigation',hypothesisId:'H2',location:'pdfGenerator.service.ts:generatePdf:storagePath',message:'Resolved storage path before writing PDF',data:{storagePath,documentsDir,templateFile,documentType,studentId},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        await ensureNASDirectoryExists(documentsDir);

        // Create filename
        const timestamp = Date.now();
        const filename = `${documentType.toLowerCase()}_${timestamp}.pdf`;
        const filepath = path.join(documentsDir, filename);

        // Write PDF to storage
        fs.writeFileSync(filepath, buffer);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/46b30d57-8d19-4b14-963d-edda67b1b958',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'finalize-500-investigation',hypothesisId:'H2',location:'pdfGenerator.service.ts:generatePdf:writeSuccess',message:'PDF written successfully',data:{filepath,filename,sizeBytes:buffer.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        // Create local backup if on NAS
        createLocalBackup(filepath, buffer);

        return { filepath, filename, buffer };
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/46b30d57-8d19-4b14-963d-edda67b1b958',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'finalize-500-investigation',hypothesisId:'H3',location:'pdfGenerator.service.ts:generatePdf:catch',message:'PDF generation failed',data:{templateFile,documentType,studentId,errorName:error instanceof Error ? error.name : 'UnknownError',errorMessage:error instanceof Error ? error.message : String(error),stackTop:error instanceof Error && error.stack ? error.stack.split('\n').slice(0,3).join(' | ') : null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
