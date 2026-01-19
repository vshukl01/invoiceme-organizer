// drive.ts
// Placeholder for later enhancements:
// - validate drive folder id format
// - store per user/org securely
// - verify SA has access to folder (future)
/**
 * In MVP we store user-provided Drive folder IDs in DB.
 * Security hardening later: do NOT allow arbitrary folder IDs from user (we already added this as future task).
 */

export function extractDriveFolderId(urlOrId: string): string {
  // Accept either a raw folder ID or a URL like:
  // https://drive.google.com/drive/folders/<ID>?usp=...
  const m = urlOrId.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (m?.[1]) return m[1];
  return urlOrId.trim();
}
