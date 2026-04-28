/**
 * Email notifications link to /documents and /documents/:id. These paths are
 * resolved by DocumentEmailLanding, then optionally ?doc= on role document tabs.
 */
export function isSafeDocumentEmailNextPath(raw: string | null | undefined): boolean {
  if (raw == null || typeof raw !== "string") return false;
  try {
    const path = decodeURIComponent(raw.trim());
    if (!path.startsWith("/") || path.includes("//") || path.includes("..")) return false;
    return /^\/documents(\/[A-Za-z0-9-]+)?$/.test(path);
  } catch {
    return false;
  }
}

export function decodeSafeDocumentNext(raw: string): string | null {
  if (!isSafeDocumentEmailNextPath(raw)) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
}
