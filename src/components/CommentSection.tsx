"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

export interface Comment {
  id: string;
  pageId: string;
  author: string;
  content: string;
  createdAt: string;
}

export default function CommentSection({ pageId }: { pageId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?pageId=${pageId}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => setComments([]));
  }, [pageId]);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, author: author || "익명", content: content.trim() }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setContent("");
        setAuthor("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
      <h2 className="mb-4 font-semibold text-cyan-400">댓글</h2>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="닉네임 (선택)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="rounded-lg border border-white/20 bg-slate-700/50 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="댓글을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 rounded-lg border border-white/20 bg-slate-700/50 px-3 py-2 text-sm"
          />
          <button
            onClick={submit}
            disabled={loading || !content.trim()}
            className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            등록
          </button>
        </div>
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-slate-700/30 px-3 py-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-cyan-400">{c.author}</span>
                <span className="text-white">{format(new Date(c.createdAt), "yyyy.MM.dd HH:mm")}</span>
              </div>
              <p className="mt-1 text-white">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-center text-white">첫 댓글을 남겨보세요.</p>}
        </div>
      </div>
    </div>
  );
}
