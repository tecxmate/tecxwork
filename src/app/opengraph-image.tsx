import { ImageResponse } from "next/og";

export const alt = "tecxwork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadInstrumentSerifItalic(): Promise<ArrayBuffer> {
  const cssRes = await fetch(
    "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  const css = await cssRes.text();
  const match = css.match(/url\((https:\/\/[^)]+\.(?:woff2|ttf|otf))\)/);
  if (!match) throw new Error("Instrument Serif font URL not found");
  const fontRes = await fetch(match[1]);
  return fontRes.arrayBuffer();
}

export default async function OGImage() {
  const fontData = await loadInstrumentSerifItalic();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            fontFamily: "Instrument Serif",
            fontStyle: "italic",
            fontSize: 280,
            color: "#8C52FF",
            lineHeight: 1,
          }}
        >
          tecxwork
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: fontData,
          style: "italic",
          weight: 400,
        },
      ],
    }
  );
}
