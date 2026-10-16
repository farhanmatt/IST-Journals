import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const submissionId = formData.get('submissionId') as string;

    const fileTypeParam = (formData.get('type') as string) || 'MANUSCRIPT';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    if (!submissionId) {
      return NextResponse.json({ success: false, message: 'Submission ID is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership or role permission for the submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { authorId: true, status: true }
    });

    if (!submission) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }

    const userRoles = session.user.roles || [];
    const isAuthor = submission.authorId === session.user.id;
    const isCopyEditor = userRoles.includes('COPYEDITOR');
    const isProductionEditor = userRoles.includes('PRODUCTION_EDITOR');
    const isEditorOrAdmin = userRoles.includes('EDITOR') || userRoles.includes('ADMIN');

    if (!isAuthor && !isCopyEditor && !isProductionEditor && !isEditorOrAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (isAuthor && (submission.status === "REJECTED" || submission.status === "DESK_REJECTED")) {
      return NextResponse.json({ 
        success: false, 
        message: "This manuscript has been rejected and cannot be modified or re-uploaded. If you wish to submit again, please create a new submission." 
      }, { status: 403 });
    }

    let assignedType = 'MANUSCRIPT';
    if (fileTypeParam) {
      assignedType = fileTypeParam;
    } else if (isProductionEditor) {
      assignedType = file.name.toLowerCase().endsWith('.pdf') ? 'PRODUCTION_READY_PDF' : 'PRODUCTION_READY_HTML';
    } else if (isCopyEditor) {
      assignedType = 'COPYEDITED_FILE';
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${submissionId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'manuscripts');
    
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/manuscripts/${fileName}`;

    const newId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    
    const highestVersionFile = await prisma.submissionFile.findFirst({
      where: { submissionId, type: assignedType as any },
      orderBy: { version: 'desc' },
      select: { version: true }
    });
    const nextVersion = (highestVersionFile?.version || 0) + 1;

    await prisma.$executeRaw`
      INSERT INTO "SubmissionFile" ("id", "submissionId", "uploaderId", "type", "url", "originalName", "mimeType", "size", "version", "createdAt")
      VALUES (
        ${newId},
        ${submissionId},
        ${session.user.id},
        ${assignedType}::"FileType",
        ${fileUrl},
        ${file.name},
        ${file.type},
        ${file.size},
        ${nextVersion},
        NOW()
      )
    `;

    return NextResponse.json({ success: true, url: fileUrl, fileId: newId });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, message: 'Server error: ' + error.message, stack: error.stack }, { status: 500 });
  }
}
