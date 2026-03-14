import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-3xl font-bold text-white">페이지를 찾을 수 없습니다</h1>
      <p className="text-slate-400">요청하신 주소가 없거나 이동했을 수 있습니다.</p>
      <Link
        href="/"
        className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600"
      >
        홈으로 이동
      </Link>
    </div>
  );
}




