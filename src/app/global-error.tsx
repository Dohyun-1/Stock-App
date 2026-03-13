"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body style={{ background: "#0f172a", color: "#e2e8f0", fontFamily: "sans-serif", padding: "2rem", minHeight: "100vh" }}>
        <div style={{ maxWidth: "32rem", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ color: "#ef4444", marginBottom: "1rem" }}>오류가 발생했습니다</h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>{error.message}</p>
          <button
            onClick={() => reset()}
            style={{ background: "#06b6d4", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer" }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
