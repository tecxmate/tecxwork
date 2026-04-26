import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/upload
 * Uploads an image to Vercel Blob storage.
 * Requires authentication.
 * Body: FormData with "file" and "type" (avatar | logo)
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!type || !["avatar", "logo", "gallery", "homepage"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid type. Must be 'avatar', 'logo', 'gallery', or 'homepage'" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 4MB" },
      { status: 400 }
    );
  }

  const folders: Record<string, string> = {
    avatar: "avatars",
    logo: "logos",
    gallery: "gallery",
    homepage: "homepage",
  };
  const folder = folders[type];
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${folder}/${session.userId}-${Date.now()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
