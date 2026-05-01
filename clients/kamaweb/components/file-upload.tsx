"use client";

import { useState, useRef } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Volume2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  uploadFile,
  isFileTypeAllowed,
  formatFileSize,
  getFileSizeMB,
  isFileSizeValid,
  type UploadBucket,
} from "@/lib/upload-service";
import { toast } from "sonner";

interface FileUploadProps {
  bucket: UploadBucket;
  folder: string;
  accepts: "image" | "video" | "audio" | "both";
  onUploadComplete: (url: string, filename: string) => void;
  currentValue?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  bucket,
  folder,
  accepts,
  onUploadComplete,
  currentValue,
  maxSize = 50,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentValue || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const getAcceptedMimeTypes = () => {
    if (accepts === "image")
      return ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (accepts === "video")
      return ["video/mp4", "video/webm", "video/quicktime"];
    if (accepts === "audio")
      return ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];
    return [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];
  };

  const getAcceptString = () => {
    if (accepts === "image") return ".jpg,.jpeg,.png,.webp,.gif";
    if (accepts === "video") return ".mp4,.webm,.mov";
    if (accepts === "audio") return ".mp3,.wav,.ogg,.m4a";
    return ".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov";
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file type
    const allowedTypes = getAcceptedMimeTypes();
    if (!isFileTypeAllowed(file, allowedTypes)) {
      const errorMsg = `Invalid file type. Accepted: ${accepts}`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate file size
    if (!isFileSizeValid(file, maxSize)) {
      const fileSizeMB = getFileSizeMB(file);
      const errorMsg = `File size (${fileSizeMB.toFixed(2)}MB) exceeds ${maxSize}MB limit`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFile(file, bucket, folder, (prog) => {
        setProgress(prog.percentage);
      });

      // Set preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      onUploadComplete(result.url, file.name);
      toast.success("File uploaded successfully");
      setProgress(100);

      // Reset after short delay
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Upload failed";
      setError(errorMsg);
      toast.error(errorMsg);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onUploadComplete("", "");
  };

  const getIcon = () => {
    if (accepts === "image") return <ImageIcon className="size-12" />;
    if (accepts === "video") return <Video className="size-12" />;
    if (accepts === "audio") return <Volume2 className="size-12" />;
    return <Upload className="size-12" />;
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : error
              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
              : "border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString()}
          onChange={handleFileInputChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="size-12 animate-spin text-blue-500" />
          ) : error ? (
            <AlertCircle className="size-12 text-red-500" />
          ) : (
            <div className="text-muted-foreground">{getIcon()}</div>
          )}

          <div className="space-y-1">
            <p className="font-medium">
              {uploading
                ? "Uploading..."
                : error
                  ? "Upload failed"
                  : "Drag and drop or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground">
              {error
                ? error
                : accepts === "image"
                  ? `PNG, JPG, WebP, GIF up to ${maxSize}MB`
                  : accepts === "video"
                    ? `MP4, WebM, MOV up to ${maxSize}MB`
                    : accepts === "audio"
                      ? `MP3, WAV, OGG, M4A up to ${maxSize}MB`
                      : `Image or video up to ${maxSize}MB`}
            </p>
          </div>

          {!uploading && (
            <Button
              type="button"
              variant={error ? "destructive" : "outline"}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Upload className="mr-2 size-4" />
              {error ? "Retry" : "Choose file"}
            </Button>
          )}
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full rounded-lg border border-muted-foreground/20 object-cover max-h-64"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-2"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
