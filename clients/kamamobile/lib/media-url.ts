export function normalizeRemoteMediaUrl(url?: string | null): string | null {
  const value = typeof url === "string" ? url.trim() : "";
  if (!value) return null;

  const driveFileMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  const driveOpenMatch = value.match(/[?&]id=([^&]+)/i);
  const driveId = driveFileMatch?.[1] ?? driveOpenMatch?.[1];

  if (value.includes("drive.google.com") && driveId) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
      driveId,
    )}`;
  }

  return value;
}
