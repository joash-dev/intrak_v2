import type { AxiosError } from 'axios';

/**
 * When `responseType: 'blob'`, error bodies are a Blob; parse JSON for `message`.
 */
export async function getMessageFromAxiosError(err: unknown): Promise<string | undefined> {
  const e = err as AxiosError<unknown>;
  const data = e.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text) as { message?: string };
        return typeof parsed.message === 'string' ? parsed.message : text || undefined;
      } catch {
        return text || undefined;
      }
    } catch {
      return undefined;
    }
  }
  if (data && typeof data === 'object' && data !== null && 'message' in data) {
    const m = (data as { message?: unknown }).message;
    return typeof m === 'string' ? m : undefined;
  }
  return undefined;
}
