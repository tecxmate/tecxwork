import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background: "#8C52FF",
          fontSize: 110,
          fontWeight: 700,
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        V
      </div>
    ),
    { width: 192, height: 192 }
  );
}
