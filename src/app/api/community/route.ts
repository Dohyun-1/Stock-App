import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DATA_FILE = path.join(process.cwd(), "data", "community.json");

export interface CommunityPost {
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

export interface CommunityReply {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  provider: string;
  content: string;
  createdAt: string;
}

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readPosts(): CommunityPost[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writePosts(posts: CommunityPost[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

export async function GET() {
  const posts = readPosts();
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { authorId, authorName, authorImage, provider, content } = body;
  if (!authorId || !content?.trim()) {
    return NextResponse.json({ error: "authorId and content required" }, { status: 400 });
  }

  const posts = readPosts();
  const post: CommunityPost = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorId,
    authorName: authorName || "사용자",
    authorImage: authorImage || null,
    provider: provider || "unknown",
    content: String(content).trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
    likes: [],
    replies: [],
  };
  posts.push(post);
  writePosts(posts);
  return NextResponse.json({ post });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { postId, action, authorId, authorName, authorImage, provider, content } = body;

  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx === -1) return NextResponse.json({ error: "post not found" }, { status: 404 });

  if (action === "like") {
    const likeIdx = posts[idx].likes.indexOf(authorId);
    if (likeIdx >= 0) {
      posts[idx].likes.splice(likeIdx, 1);
    } else {
      posts[idx].likes.push(authorId);
    }
  } else if (action === "reply") {
    if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });
    const reply: CommunityReply = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      authorId,
      authorName: authorName || "사용자",
      authorImage: authorImage || null,
      provider: provider || "unknown",
      content: String(content).trim().slice(0, 500),
      createdAt: new Date().toISOString(),
    };
    posts[idx].replies.push(reply);
  }

  writePosts(posts);
  return NextResponse.json({ post: posts[idx] });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { postId, authorId } = body;

  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx === -1) return NextResponse.json({ error: "post not found" }, { status: 404 });
  if (posts[idx].authorId !== authorId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  posts.splice(idx, 1);
  writePosts(posts);
  return NextResponse.json({ deleted: true });
}
