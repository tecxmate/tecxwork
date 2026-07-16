import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_UPLOAD_TYPES = [
  "avatar",
  "logo",
  "gallery",
  "homepage",
  "page",
  "feedback",
];

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * POST /api/upload
 * Uploads an image to Cloudflare R2 storage.
 * Requires authentication.
 * Body: FormData with "file" and "type".
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    if (!isR2Configured()) {
      return jsonError(
        "Image uploads are not configured. Missing R2 storage credentials.",
        503
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return jsonError("No file provided", 400);
    }

    if (!type || !ALLOWED_UPLOAD_TYPES.includes(type)) {
      return jsonError(
        "Invalid type. Must be 'avatar', 'logo', 'gallery', 'homepage', 'page', or 'feedback'",
        400
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError("Invalid file type. Allowed: JPEG, PNG, WebP, GIF", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File too large. Maximum size is 4MB", 400);
    }

    const folders: Record<string, string> = {
      avatar: "avatars",
      logo: "logos",
      gallery: "gallery",
      homepage: "homepage",
      page: "page-images",
      feedback: "feedback",
    };
    const folder = folders[type];
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${folder}/${session.userId}-${Date.now()}.${ext}`;

    const { url } = await uploadToR2(filename, file, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Image upload failed", error);
    return jsonError("Image upload failed. Please try again.", 500);
  }
}
