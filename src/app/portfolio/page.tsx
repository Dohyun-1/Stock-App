"use client";

import Community from "@/components/Community";
import NewsSection from "@/components/NewsSection";

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-cyan-400">커뮤니티</h1>
      <p className="text-white">투자에 대해 자유롭게 이야기하고 의견을 공유하세요.</p>

      <Community />
      <NewsSection />
    </div>
  );
}
