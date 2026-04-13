"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X } from "lucide-react";

/**
 * Floating button that shows a fullscreen QR code of the student's CV.
 * Fetches the CV link from /api/me/profile on first click.
 */
export function CvQrButton() {
  const [open, setOpen] = useState(false);
  const [cvLink, setCvLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    if (!cvLink) {
      setLoading(true);
      try {
        const res = await fetch("/api/me/profile");
        if (res.ok) {
          const data = await res.json();
          setCvLink(data.profile.cvLink);
        }
      } catch {}
      setLoading(false);
    }
    setOpen(true);
  }

  if (open && cvLink) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        onClick={() => setOpen(false)}
      >
        <button
          className="absolute right-4 top-4 cursor-pointer rounded-full bg-gray-100 p-2"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <p className="mb-2 text-lg font-bold text-black">My CV</p>
        <p className="mb-6 text-sm text-gray-500">
          Show this QR code to recruiters
        </p>

        <QRCodeSVG
          value={cvLink}
          size={Math.min(
            typeof window !== "undefined" ? window.innerWidth - 80 : 300,
            350
          )}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#020202"
        />

        <p className="mt-6 max-w-xs truncate text-center text-xs text-gray-400">
          {cvLink}
        </p>
        <p className="mt-4 text-xs text-gray-300">Tap anywhere to close</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label="Show CV QR Code"
    >
      <QrCode className="h-6 w-6" />
    </button>
  );
}
