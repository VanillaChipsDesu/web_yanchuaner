import fs from 'node:fs';
import path from 'node:path';

/** icon → 板块英文名映射 */
const ICON_CATEGORY: Record<string, string> = {
  house: 'campus',
  landmark: 'building',
  library: 'library',
  mountain: 'playground',
  trees: 'garden',
  camera: 'album',
};

export function iconToCategory(icon: string): string {
  return ICON_CATEGORY[icon] || icon;
}

/**
 * 将 public/uploads/ 下的临时上传文件重命名为板块规范名。
 * 格式: {category}{sortOrder}.{ext}  例: campus1.jpg
 *
 * @returns 新路径 `/uploads/xxx.jpg`，失败返回原路径
 */
export function renameToCategoryPath(
  oldImagePath: string,
  icon: string,
  sortOrder: number,
): string {
  if (!oldImagePath || !oldImagePath.startsWith('/uploads/')) return oldImagePath;

  const oldFilename = oldImagePath.replace('/uploads/', '');
  const extMatch = oldFilename.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';

  const category = iconToCategory(icon);
  const newFilename = `${category}${sortOrder}.${ext}`;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const oldPath = path.join(uploadsDir, oldFilename);
  const newPath = path.join(uploadsDir, newFilename);

  // 如果新旧路径相同，无需操作
  if (oldPath === newPath) return `/uploads/${newFilename}`;

  try {
    if (fs.existsSync(oldPath)) {
      // 如果目标已存在（覆盖旧文件），先删
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }
      fs.renameSync(oldPath, newPath);
      return `/uploads/${newFilename}`;
    }
  } catch {
    // 重命名失败，返回原路径
  }

  return oldImagePath;
}
