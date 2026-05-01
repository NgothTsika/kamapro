/**
 * Upload Service for Supabase Storage
 * Client-side file upload with validation and progress tracking
 * Uses the server API endpoint for secure uploads
 */

export type UploadBucket =
  | "lesson-covers"
  | "chapter-media"
  | "character-images"
  | "character-inventions"
  | "user-avatars"
  | "community-submissions"
  | "achievement-icons"
  | "category-icons"
  | "quiz-media"
  | "admin-backups";

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Allowed MIME types by category
 */
const MIME_TYPES = {
  image: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  document: [
    "application/json",
    "application/zip",
    "application/x-gzip",
    "text/csv",
    "application/pdf",
  ],
};

/**
 * Upload a file to Supabase via server API
 * Server-side upload provides:
 * - RLS bypass with service role
 * - Better error handling
 * - Proper file validation
 * - Progress tracking
 *
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param folder - Folder path within bucket
 * @param onProgress - Optional progress callback
 * @returns Upload result with URL and metadata
 */
export async function uploadFile(
  file: File,
  bucket: UploadBucket,
  folder: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  // Validate file
  if (!file) {
    throw new Error("No file provided");
  }

  // Create FormData
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  formData.append("folder", folder);

  try {
    // Simulate progress
    let progressInterval: NodeJS.Timeout | undefined;
    if (onProgress) {
      progressInterval = setInterval(() => {
        onProgress({
          loaded: 0,
          total: file.size,
          percentage: Math.min(90, Math.random() * 90),
        });
      }, 100);
    }

    // Upload via server API (proxied through Next.js)
    const response = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type, let the browser set it with boundary
      },
    });

    if (progressInterval) clearInterval(progressInterval);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Upload failed with status ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || "Upload failed");
    }

    // Report 100% progress
    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
      });
    }

    return data.data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";
    throw new Error(errorMessage);
  }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - Full path to file (including filename)
 */
export async function deleteFile(
  bucket: UploadBucket,
  path: string,
): Promise<void> {
  try {
    const response = await fetch("/api/storage/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bucket, path }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Delete failed");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Delete failed");
    }
  } catch (error) {
    throw new Error(
      `Delete error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Delete multiple files from Supabase Storage
 * @param bucket - Storage bucket name
 * @param paths - Array of file paths to delete
 */
export async function deleteFiles(
  bucket: UploadBucket,
  paths: string[],
): Promise<void> {
  try {
    const response = await fetch("/api/storage/delete-multiple", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bucket, paths }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Bulk delete failed");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Bulk delete failed");
    }
  } catch (error) {
    throw new Error(
      `Bulk delete error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Check if file type is allowed
 * @param file - File to check
 * @param allowedTypes - Array of allowed MIME types
 */
export function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(
    (type) =>
      file.type === type ||
      (type.endsWith("/*") && file.type.startsWith(type.replace("/*", ""))),
  );
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get allowed MIME types for category
 */
export function getAllowedMimeTypes(
  category: "image" | "video" | "audio" | "document",
): string[] {
  return MIME_TYPES[category] || [];
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 */
export function isFileSizeValid(file: File, maxSizeMB: number): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Get file size in MB
 */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024);
}
