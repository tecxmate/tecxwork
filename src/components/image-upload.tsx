"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageUploadProps = {
  value?: string;
  onChange: (url: string | null) => void;
  type: "avatar" | "logo" | "gallery" | "homepage";
  className?: string;
  disabled?: boolean;
};

export function ImageUpload({
  value,
  onChange,
  type,
  className = "",
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError("File too large. Maximum size is 4MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    onChange(null);
  }

  const sizeClasses = type === "avatar"
    ? "h-24 w-24 rounded-full"
    : type === "logo"
    ? "h-24 w-24 rounded-lg"
    : "h-32 w-48 rounded-lg";

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        disabled={disabled || uploading}
        className="hidden"
      />

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className={`${sizeClasses} object-cover border border-border`}
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={`${sizeClasses} flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">Upload</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

type MultiImageUploadProps = {
  values: string[];
  onChange: (urls: string[]) => void;
  type: "gallery" | "homepage";
  max?: number;
  className?: string;
  disabled?: boolean;
};

export function MultiImageUpload({
  values,
  onChange,
  type,
  max = 4,
  className = "",
  disabled = false,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (values.length >= max) {
      setError(`Maximum ${max} images allowed.`);
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("File too large. Maximum size is 4MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onChange([...values, data.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        {values.map((url, index) => (
          <div key={url} className="relative">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="h-32 w-48 rounded-lg object-cover border border-border"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {values.length < max && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleUpload}
              disabled={disabled || uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="flex h-32 w-48 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">{values.length}/{max}</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
