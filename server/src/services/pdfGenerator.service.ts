/**
 * PDF Generator Service
 * Reads HTML templates, injects form data, and renders PDF via Puppeteer.
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { getStoragePathWithFallback, ensureNASDirectoryExists } from '../config/nas';

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
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

    try {
    // Launch Puppeteer
        browser = await puppeteer.launch({
        headless: true,
            executablePath,
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
        await ensureNASDirectoryExists(documentsDir);

        // Create filename
        const timestamp = Date.now();
        const filename = `${documentType.toLowerCase()}_${timestamp}.pdf`;
        const filepath = path.join(documentsDir, filename);

        // Write PDF to storage
        fs.writeFileSync(filepath, buffer);

        return { filepath, filename, buffer };
    } catch (error) {
        throw error;
    } finally {
        if (browser) {
        await browser.close();
        }
    }
}
