import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { requireAdmin } from '@/lib/admin-auth';
import { processToCard16x9, MAX_UPLOAD_BYTES } from '@/lib/image-pipeline';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '未提供上传文件' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '无效的文件类型。仅支持 jpeg, png, webp' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `文件过大。允许的最大尺寸为 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成可读文件名：时间戳-安全的文件名
    const rawName = (file as any).name?.replace(/[^a-zA-Z0-9._\-一-鿿]/g, '_').replace(/_{2,}/g, '_') || 'upload';
    const baseName = rawName.replace(/\.[^.]+$/, '');
    const filename = `${Date.now()}-${baseName}.jpg`; // 16:9 裁剪后始终输出 jpeg

    // 确保上传目录存在
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, filename);

    // 16:9 裁剪 + 压缩（内部自动创建目录和写入文件）
    await processToCard16x9(buffer, filePath);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url, filename }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '图片上传失败' }, { status: 500 });
  }
}
