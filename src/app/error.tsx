"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-xl font-bold text-red-400">오류가 발생했습니다</h2>
      <p className="text-white">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white hover:bg-cyan-600"
      >
        다시 시도
      </button>
    </div>
  );
}
