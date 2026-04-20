import { ImageResponse } from "next/og";
import { EVENT_CONFIG } from "@/lib/data";

export const runtime = "edge";
export const alt = `V-GEN TRIDENT — ${EVENT_CONFIG.organizerShort} Career Fair ${EVENT_CONFIG.displayYear}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#F6F3F1",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Purple accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#8C52FF",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#8C52FF",
            color: "white",
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          T
        </div>

        {/* Organizer */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#8C52FF",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {EVENT_CONFIG.organizer}
        </div>

        {/* Event name */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#020202",
            marginBottom: 12,
          }}
        >
          V-GEN TRIDENT {EVENT_CONFIG.displayYear}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 20,
            fontStyle: "italic",
            color: "#666",
            marginBottom: 24,
          }}
        >
          &ldquo;{EVENT_CONFIG.tagline}&rdquo;
        </div>

        {/* Details */}
        <div
          style={{
            display: "flex",
            gap: 32,
            fontSize: 18,
            color: "#444",
          }}
        >
          <span>{EVENT_CONFIG.displayDate}</span>
          <span>10:00 – 17:30</span>
          <span>{EVENT_CONFIG.hostedAt}</span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            fontSize: 14,
            color: "#999",
          }}
        >
          TECXWORK. Designed by Nikolas Doan 段皇方.. Developed by TECXMATE.COM
        </div>
      </div>
    ),
    { ...size }
  );
}
