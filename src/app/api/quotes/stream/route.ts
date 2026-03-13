import { NextRequest } from "next/server";
import { quoteMultiple } from "@/lib/yahoo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseSymbols(raw: string | null): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

function clampIntervalMs(raw: string | null) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 2000;
  return Math.max(1000, Math.min(5000, Math.floor(parsed)));
}

export async function GET(request: NextRequest) {
  const symbols = parseSymbols(request.nextUrl.searchParams.get("symbols"));
  if (symbols.length === 0) {
    return new Response(JSON.stringify({ error: "symbols required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const intervalMs = clampIntervalMs(request.nextUrl.searchParams.get("intervalMs"));
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let keepAliveId: ReturnType<typeof setInterval> | null = null;

      const send = (event: string, payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (keepAliveId) clearInterval(keepAliveId);
        try {
          controller.close();
        } catch {}
      };

      const tick = async () => {
        if (closed) return;
        try {
          const quotes = await quoteMultiple(symbols);
          send("quotes", { quotes, ts: Date.now() });
        } catch (error) {
          send("server-error", {
            message: error instanceof Error ? error.message : String(error),
            ts: Date.now(),
          });
        } finally {
          if (!closed) timeoutId = setTimeout(tick, intervalMs);
        }
      };

      send("ready", { symbols, intervalMs, ts: Date.now() });
      void tick();

      keepAliveId = setInterval(() => {
        send("ping", { ts: Date.now() });
      }, 15000);

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      // Cleanup handled through request abort and local guards.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
