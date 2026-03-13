import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const DATA_FILE = path.join(process.cwd(), "data", "comments.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readComments(): { id: string; pageId: string; author: string; content: string; createdAt: string }[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeComments(comments: { id: string; pageId: string; author: string; content: string; createdAt: string }[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(comments, null, 2));
}

export async function GET(request: NextRequest) {
  const pageId = request.nextUrl.searchParams.get("pageId");
  const comments = readComments();
  const filtered = pageId ? comments.filter((c) => c.pageId === pageId) : comments;
  return NextResponse.json(filtered.reverse());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pageId, author, content } = body;
  if (!pageId || !content) return NextResponse.json({ error: "pageId and content required" }, { status: 400 });

  const comments = readComments();
  const comment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    pageId,
    author: author || "익명",
    content: String(content).slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  writeComments(comments);
  return NextResponse.json({ comment });
}
