import path from 'path';
import fs from 'fs';

/**
 * Resolves the path to a template file, trying multiple locations
 * to support both development and production environments.
 * 
 * @param templateName - Name of the template file (e.g., '14 INTERNSHIP TIMEFRAME_2024.docx')
 * @returns The first existing path, or the first path in the list if none exist
 */
export function resolveTemplatePath(templateName: string): string {
  // Try multiple paths in order of preference
  const pathsToTry = [
    // Production: templates copied to dist/templates (after Docker build)
    path.resolve(__dirname, '../templates', templateName),
    // Development: templates in src/templates
    path.resolve(__dirname, '../../src/templates', templateName),
    // Alternative: absolute path from project root
    path.resolve(process.cwd(), 'src', 'templates', templateName),
    // Legacy: server/src/templates (for some deployment setups)
    path.resolve(process.cwd(), 'server', 'src', 'templates', templateName),
  ];

  // Find the first path that exists
  const existingPath = pathsToTry.find(p => fs.existsSync(p));

  // If none exist, use the first one (will show error when accessed)
  return existingPath || pathsToTry[0];
}

