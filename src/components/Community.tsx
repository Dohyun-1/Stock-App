"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { MessageCircle, Heart, Trash2, Send, ChevronDown, ChevronUp, LogIn } from "lucide-react";

interface CommunityReply {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  provider: string;
  content: string;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  provider: string;
  content: string;
  createdAt: string;
  likes: string[];
  replies: CommunityReply[];
}

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      </span>
    );
  }
  return null;
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- OAuth provider avatar URL */
      <img
        src={image}
        alt={name}
        className="h-8 w-8 rounded-full border border-white/20 object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
      {initial}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return format(new Date(dateStr), "yyyy.MM.dd");
}

function PostCard({
  post,
  userId,
  onLike,
  onReply,
  onDelete,
}: {
  post: CommunityPost;
  userId: string | null;
  onLike: (postId: string) => void;
  onReply: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);

  const liked = userId ? post.likes.includes(userId) : false;

  return (
    <div className="rounded-xl border border-white/15 bg-slate-800/50 p-4 transition hover:border-white/25">
      <div className="flex items-start gap-3">
        <Avatar name={post.authorName} image={post.authorImage} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{post.authorName}</span>
            <ProviderBadge provider={post.provider} />
            <span className="text-xs text-slate-500">{timeAgo(post.createdAt)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{post.content}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-white/10 pt-3">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-xs transition ${liked ? "text-rose-400" : "text-slate-400 hover:text-rose-400"}`}
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
          {post.likes.length > 0 && post.likes.length}
        </button>
        <button
          onClick={() => setReplyOpen(!replyOpen)}
          className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-cyan-400"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {post.replies.length > 0 && post.replies.length}
        </button>
        {userId && post.authorId === userId && (
          <button
            onClick={() => onDelete(post.id)}
            className="ml-auto flex items-center gap-1 text-xs text-slate-500 transition hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
            삭제
          </button>
        )}
      </div>

      {post.replies.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
          >
            {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            답글 {post.replies.length}개
          </button>
          {showReplies && (
            <div className="mt-2 space-y-2 border-l-2 border-white/10 pl-4">
              {post.replies.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <Avatar name={r.authorName} image={r.authorImage} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{r.authorName}</span>
                      <ProviderBadge provider={r.provider} />
                      <span className="text-[10px] text-slate-500">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-300">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {replyOpen && userId && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="답글을 입력하세요..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && replyText.trim()) {
                onReply(post.id, replyText.trim());
                setReplyText("");
                setShowReplies(true);
              }
            }}
            className="flex-1 rounded-lg border border-white/15 bg-slate-700/50 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <button
            onClick={() => {
              if (replyText.trim()) {
                onReply(post.id, replyText.trim());
                setReplyText("");
                setShowReplies(true);
              }
            }}
            className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-cyan-400 transition hover:bg-cyan-500/30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Community() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userId = (session?.user as Record<string, unknown>)?.id as string | null;
  const userName = session?.user?.name ?? "사용자";
  const userImage = session?.user?.image ?? null;
  const provider = (session as unknown as Record<string, unknown>)?.provider as string ?? "oauth";

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/community");
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 15000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const submitPost = async () => {
    if (!content.trim() || !userId) return;
    setPosting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: userId,
          authorName: userName,
          authorImage: userImage,
          provider,
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
        setContent("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    } catch {
      /* ignore */
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!userId) return;
    try {
      const res = await fetch("/api/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action: "like", authorId: userId }),
      });
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      }
    } catch {
      /* ignore */
    }
  };

  const handleReply = async (postId: string, replyContent: string) => {
    if (!userId) return;
    try {
      const res = await fetch("/api/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          action: "reply",
          authorId: userId,
          authorName: userName,
          authorImage: userImage,
          provider,
          content: replyContent,
        }),
      });
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      }
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (postId: string) => {
    if (!userId) return;
    try {
      await fetch("/api/community", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, authorId: userId }),
      });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      /* ignore */
    }
  };

  const autoGrow = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-slate-800/60 p-5 shadow-md shadow-black/40">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <MessageCircle className="h-5 w-5 text-cyan-400" />
            커뮤니티
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">투자에 대해 자유롭게 이야기하세요</p>
        </div>
        {status === "authenticated" && session?.user && (
          <div className="flex items-center gap-2">
            <Avatar name={userName} image={userImage} />
            <span className="text-sm font-medium text-slate-300">{userName}</span>
          </div>
        )}
      </div>

      {status === "authenticated" ? (
        <div className="mb-5">
          <textarea
            ref={textareaRef}
            placeholder="투자 전략, 종목 분석, 시장 의견을 공유하세요..."
            value={content}
            onChange={autoGrow}
            rows={2}
            className="w-full resize-none rounded-xl border border-white/15 bg-slate-700/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={submitPost}
              disabled={posting || !content.trim()}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              게시
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-dashed border-white/20 bg-slate-700/30 p-6 text-center">
          <LogIn className="mx-auto mb-2 h-8 w-8 text-slate-500" />
          <p className="mb-3 text-sm text-slate-400">로그인하면 커뮤니티에 참여할 수 있어요</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userId={userId}
            onLike={handleLike}
            onReply={handleReply}
            onDelete={handleDelete}
          />
        ))}
        {posts.length === 0 && (
          <div className="py-8 text-center">
            <MessageCircle className="mx-auto mb-2 h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-500">아직 게시글이 없습니다</p>
            <p className="text-xs text-slate-600">첫 번째 게시글을 작성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
