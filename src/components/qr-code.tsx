"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Download, Copy, Check } from "lucide-react";

export function QRCard({
  value,
  title,
  subtitle,
  size = 180,
}: {
  value: string;
  title: string;
  subtitle?: string;
  size?: number;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const svg = document.getElementById(`qr-${title}`)?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const a = document.createElement("a");
      a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        onClick={() => setFullscreen(false)}
      >
        <p className="mb-4 text-lg font-semibold text-black">{title}</p>
        <QRCodeSVG
          value={value}
          size={Math.min(window.innerWidth - 64, 400)}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#020202"
        />
        {subtitle && (
          <p className="mt-4 text-sm text-gray-500">{subtitle}</p>
        )}
        <p className="mt-6 text-xs text-gray-400">Tap anywhere to close</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div
          id={`qr-${title}`}
          className="rounded-lg bg-white p-3"
        >
          <QRCodeSVG
            value={value}
            size={size}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#020202"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(true)}
          >
            <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
            Fullscreen
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
