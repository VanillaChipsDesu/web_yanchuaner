import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { readJsonBody } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const stories = await prisma.story.findMany({
      orderBy: { date: 'desc' },
      take: 200, // 限制拉取最大条数，避免大表全拉 DoS
    });

    const data = stories.map((s) => {
      let parsedTags = [];
      try {
        parsedTags = JSON.parse(s.tags || '[]');
      } catch {}
      return {
        ...s,
        tags: parsedTags,
      };
    });

    return NextResponse.json({ stories: data });
  } catch (error) {
    console.error('Admin stories GET error:', error);
    return NextResponse.json({ error: '加载失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await readJsonBody<{
      title?: unknown;
      author?: unknown;
      tags?: unknown;
      body?: unknown;
      date?: unknown;
    }>(req, 524288); // 512KB limit

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const author = typeof body.author === "string" ? body.author.trim() : "";
    const storyBody = typeof body.body === "string" ? body.body.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";

    if (!title) return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    if (title.length > 120) return NextResponse.json({ error: '标题长度不超过120字' }, { status: 400 });
    if (author.length > 50) return NextResponse.json({ error: '作者长度不超过50字' }, { status: 400 });
    if (!storyBody) return NextResponse.json({ error: '正文不能为空' }, { status: 400 });
    if (storyBody.length > 20000) return NextResponse.json({ error: '正文长度不超过20000字' }, { status: 400 });
    if (date.length > 20) return NextResponse.json({ error: '日期格式/长度无效' }, { status: 400 });

    const tags = Array.isArray(body.tags)
      ? body.tags.map(String).map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= 30).slice(0, 10)
      : [];

    const story = await prisma.story.create({
      data: {
        title,
        author,
        tags: JSON.stringify(tags),
        body: storyBody,
        date: date || new Date().toISOString().slice(0, 10),
      },
    });

    return NextResponse.json({ story }, { status: 201 });
  } catch (error: any) {
    console.error('Admin stories POST error:', error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
