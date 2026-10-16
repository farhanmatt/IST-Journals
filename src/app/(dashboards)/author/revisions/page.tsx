export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthorRevisionsClient } from "./AuthorRevisionsClient";

export default async function AuthorRevisionsPage({
  searchParams
}: {
  searchParams?: { id?: string }
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const submissions = await prisma.submission.findMany({
    where: {
      authorId: session.user.id,
      status: { in: ["REVISION_REQUIRED", "REVISION_SUBMITTED"] }
    },
    include: {
      section: true,
      files: {
        orderBy: { version: "desc" }
      },
      decisions: {
        include: {
          editor: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      revisions: {
        orderBy: { versionNumber: "desc" }
      },
      reviewerAssignments: {
        where: { status: "SUBMITTED" },
        select: {
          id: true,
          recommendation: true,
          commentsForAuthor: true,
          submittedAt: true
        },
        orderBy: { submittedAt: "desc" }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <AuthorRevisionsClient 
      submissions={submissions} 
      initialSelectedId={searchParams?.id}
    />
  );
}
