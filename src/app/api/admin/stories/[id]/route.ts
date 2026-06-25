import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { readJsonBody } from '@/lib/auth-utils';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const existing = await prisma.story.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '故事不存在' }, { status: 404 });

    const body = await readJsonBody<{
      title?: unknown;
      author?: unknown;
      tags?: unknown;
      body?: unknown;
      date?: unknown;
    }>(req, 524288); // 512KB limit (contains long text)

    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const author = typeof body.author === "string" ? body.author.trim() : undefined;
    const storyBody = typeof body.body === "string" ? body.body.trim() : undefined;
    const date = typeof body.date === "string" ? body.date.trim() : undefined;

    if (body.title !== undefined && (!title || title.length > 120)) {
      return NextResponse.json({ error: '标题不能为空且不超过120字' }, { status: 400 });
    }
    if (author !== undefined && author.length > 50) {
      return NextResponse.json({ error: '作者长度不超过50字' }, { status: 400 });
    }
    if (storyBody !== undefined && (!storyBody || storyBody.length > 20000)) {
      return NextResponse.json({ error: '正文不能为空且不超过20000字' }, { status: 400 });
    }
    if (date !== undefined && date.length > 20) {
      return NextResponse.json({ error: '发布日期格式/长度无效' }, { status: 400 });
    }

    let tagsStr: string | undefined;
    if (body.tags !== undefined) {
      const tags = Array.isArray(body.tags)
        ? body.tags.map(String).map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= 30).slice(0, 10)
        : [];
      tagsStr = JSON.stringify(tags);
    }

    const story = await prisma.story.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(author !== undefined && { author }),
        ...(tagsStr !== undefined && { tags: tagsStr }),
        ...(storyBody !== undefined && { body: storyBody }),
        ...(date !== undefined && { date }),
      },
    });

    return NextResponse.json({ story });
  } catch (error: any) {
    console.error('Admin stories PUT error:', error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const existing = await prisma.story.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '故事不存在' }, { status: 404 });

    await prisma.story.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin stories DELETE error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
