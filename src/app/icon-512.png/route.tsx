import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 96,
          background: "#8C52FF",
          fontSize: 300,
          fontWeight: 700,
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        V
      </div>
    ),
    { width: 512, height: 512 }
  );
}
