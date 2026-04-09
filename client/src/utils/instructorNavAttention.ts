/**
 * Keep in sync with instructorService.getNavBadgeCounts() so UI highlights match sidebar badges.
 */
export function instructorNavCountsCompanyProposal(status: string): boolean {
  return status === "SUBMITTED_TO_INSTRUCTOR";
}

export function instructorNavCountsDocumentReview(status: string): boolean {
  return status === "PENDING" || status === "RESUBMISSION_REQUESTED";
}

export function instructorNavCountsApplication(status: string): boolean {
  return status === "PENDING";
}

export function instructorNavCountsStudentAttention(status: string): boolean {
  return status === "at_risk" || status === "warning";
}

/** Strong visual marker for list rows / cards that match a sidebar alert. */
export const INSTRUCTOR_NAV_ATTENTION_RING =
  "ring-2 ring-amber-400 dark:ring-amber-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#19191c]";

/** Table row marker (ring is clipped on some tables). */
export const INSTRUCTOR_NAV_ATTENTION_ROW =
  "border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/30";

export function getSeenAttentionKey(scope: string, id: string): string {
  return `intrak:seen-attn:${scope}:${id}`;
}

export function wasAttentionSeen(scope: string, id: string): boolean {
  try {
    return sessionStorage.getItem(getSeenAttentionKey(scope, id)) === "1";
  } catch {
    return false;
  }
}

export function markAttentionSeen(scope: string, id: string): void {
  try {
    sessionStorage.setItem(getSeenAttentionKey(scope, id), "1");
  } catch {
    // ignore
  }
}
