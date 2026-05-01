"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Users, Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  isAdmin: boolean;
  placeholders: { id: number; alt: string }[];
};

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const RECOMMENDED_WIDTH = 1920;
const RECOMMENDED_HEIGHT = 1080;
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;

async function readImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

export function HomepageImageEditor({ images, isAdmin, placeholders }: Props) {
  const [currentImages, setCurrentImages] = useState<string[]>(images);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleUpload(index: number, file: File) {
    if (file.size > MAX_FILE_SIZE) {
      alert("File size must be under 4MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      const { width, height } = await readImageDimensions(file);
      const ratio = width / height;
      const tooSmall = width < MIN_WIDTH || height < MIN_HEIGHT;
      const wrongRatio = ratio < 1.5 || ratio > 2.1;
      if (tooSmall || wrongRatio) {
        const reasons: string[] = [];
        if (tooSmall) {
          reasons.push(
            `image is ${width}×${height}px (minimum ${MIN_WIDTH}×${MIN_HEIGHT}px)`
          );
        }
        if (wrongRatio) {
          reasons.push(
            `aspect ratio is ${ratio.toFixed(2)}:1 (recommended 16:9, ~1.78:1)`
          );
        }
        const proceed = confirm(
          `Heads up — this photo may not look great in the hero carousel:\n\n• ${reasons.join("\n• ")}\n\nRecommended: ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT}px, 16:9, under 4MB.\n\nUpload anyway?`
        );
        if (!proceed) return;
      }
    } catch {
      // If we can't read dimensions, fall through and let the upload proceed.
    }

    setUploading(index);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "homepage");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }

      const { url } = await uploadRes.json();

      const newImages = [...currentImages];
      newImages[index] = url;

      // Pad array if needed
      while (newImages.length <= index) {
        newImages.push("");
      }
      newImages[index] = url;

      // Save to database
      const saveRes = await fetch("/api/admin/homepage-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homepageImages: newImages.filter(Boolean) }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save");
      }

      setCurrentImages(newImages);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function handleRemove(index: number) {
    if (!confirm("Remove this image?")) return;

    const newImages = [...currentImages];
    newImages[index] = "";

    try {
      const saveRes = await fetch("/api/admin/homepage-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homepageImages: newImages.filter(Boolean) }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save");
      }

      setCurrentImages(newImages);
    } catch (err) {
      alert("Failed to remove image");
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <div className="rounded-md border-l-4 border-primary bg-muted p-3 text-xs text-muted-foreground sm:text-sm">
          <p className="mb-1 font-medium text-foreground">Image guidelines</p>
          <ul className="list-disc space-y-0.5 pl-5">
            <li>
              Recommended size: <strong>{RECOMMENDED_WIDTH}×{RECOMMENDED_HEIGHT}px</strong>{" "}
              (16:9, landscape) — fills the hero carousel without cropping.
            </li>
            <li>
              Minimum size: {MIN_WIDTH}×{MIN_HEIGHT}px. Smaller images look soft on large
              screens.
            </li>
            <li>Max file size: 4MB. JPG or PNG. Up to 4 photos.</li>
          </ul>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholders.map((photo, index) => {
        const imageUrl = currentImages[index];
        const isUploading = uploading === index;

        return (
          <div
            key={photo.id}
            className={cn(
              "group relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary",
              isAdmin && "cursor-pointer"
            )}
            onClick={() => {
              if (isAdmin && !isUploading) {
                fileInputRefs.current[index]?.click();
              }
            }}
          >
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {isAdmin && (
                  <>
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-2">
                        <div className="rounded-full bg-white/90 p-2">
                          <Camera className="h-5 w-5 text-gray-700" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(index);
                          }}
                          className="rounded-full bg-red-500 p-2 hover:bg-red-600"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    {isAdmin ? (
                      <>
                        <Camera className="mx-auto h-8 w-8 opacity-50 transition-opacity group-hover:opacity-80" />
                        <p className="mt-2 text-xs">Click to upload</p>
                      </>
                    ) : (
                      <>
                        <Users className="mx-auto h-8 w-8 opacity-50" />
                        <p className="mt-2 text-xs">{photo.alt}</p>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {isUploading && imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}

            {isAdmin && (
              <input
                ref={(el) => { fileInputRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUpload(index, file);
                  }
                  e.target.value = "";
                }}
              />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
