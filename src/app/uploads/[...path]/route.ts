import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path || [];
  // Prevent directory traversal attacks
  const safePath = segments.map((s) => s.replace(/(\.\.[\/\\]|\.\.)/g, '')).join(path.sep);

  const publicPath = path.join(process.cwd(), 'public', 'uploads', safePath);
  const tmpPath = path.join('/tmp', 'uploads', safePath);

  let fileBuffer: Buffer | null = null;
  try {
    fileBuffer = await fs.readFile(publicPath);
  } catch {
    try {
      fileBuffer = await fs.readFile(tmpPath);
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }
  }

  const ext = path.extname(safePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.html': 'text/html',
    '.txt': 'text/plain',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
