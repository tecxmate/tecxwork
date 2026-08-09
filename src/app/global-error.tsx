"use client";

/**
 * Last-resort boundary: catches errors thrown in the root layout itself, where error.tsx
 * cannot help because the layout that would wrap it is the thing that failed.
 *
 * It must render its own <html> and <body>, and it cannot rely on the app's providers,
 * fonts or theme — so the styling here is deliberately inline and self-contained rather
 * than reaching for the design system that may be exactly what broke.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#FAFAFA",
          color: "#1D1D1F",
          fontFamily:
            "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            The page could not load
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6E6E73", margin: "0 0 1.25rem" }}>
            Something failed before the app could start. Reloading usually fixes it.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#6E6E73",
                background: "#F3F0F9",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                margin: "0 0 1.25rem",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              height: "2.5rem",
              padding: "0 1rem",
              borderRadius: "8px",
              border: 0,
              background: "#8C52FF",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
