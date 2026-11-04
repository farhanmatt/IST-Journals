export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Award, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date";

export default async function AuthorProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, totalSubmissions, underReviewCount, publishedCount, draftCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { roles: true }
    }),
    prisma.submission.count({
      where: { authorId: session.user.id }
    }),
    prisma.submission.count({
      where: { 
        authorId: session.user.id,
        status: { in: ["UNDER_REVIEW", "INITIAL_SCREENING", "REVIEWS_COMPLETED", "REVISION_REQUIRED"] }
      }
    }),
    prisma.submission.count({
      where: { authorId: session.user.id, status: "PUBLISHED" }
    }),
    prisma.submission.count({
      where: { authorId: session.user.id, status: "DRAFT" }
    })
  ]);

  if (!user) redirect("/login");

  const userRoles = user.roles.map(r => r.role);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Author Profile</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Account credentials, scholarly publishing portfolio, and author affiliation details.
          </p>
        </div>
        <Link
          href="/author/submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-glow transition-all shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Submission</span>
        </Link>
      </div>

      {/* Main Profile Identity Card */}
      <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            {user.name ? user.name.slice(0, 2).toUpperCase() : "AU"}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{user.name}</h2>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Scholar</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Member since {formatDateTime(user.createdAt)}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap gap-1.5">
              {userRoles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 uppercase tracking-wider"
                >
                  {role.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Author Publishing Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalSubmissions}</p>
          <Link href="/author/submissions" className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 mt-2">
            <span>View all</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{underReviewCount}</p>
          <Link href="/author/submissions" className="inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-800 mt-2">
            <span>Track progress</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published Articles</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{publishedCount}</p>
          <Link href="/author/published" className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-800 mt-2">
            <span>Explore papers</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Drafts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{draftCount}</p>
          <Link href="/author/drafts" className="inline-flex items-center text-xs font-bold text-purple-600 hover:text-purple-800 mt-2">
            <span>Resume editing</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Account Details & Author Guidelines Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Account Details</span>
          </h3>

          <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="py-2.5 flex justify-between">
              <dt className="text-slate-500 font-medium">Full Name</dt>
              <dd className="font-semibold text-slate-900">{user.name}</dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-slate-500 font-medium">Registered Email</dt>
              <dd className="font-semibold text-slate-900">{user.email}</dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-slate-500 font-medium">Account Status</dt>
              <dd className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-slate-500 font-medium">Author ID</dt>
              <dd className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {user.id}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Publishing Standards & Ethics</h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All submitted manuscripts adhere to COPE (Committee on Publication Ethics) principles. Please ensure all co-authors are credited and conflicts of interest are disclosed.
          </p>

          <div className="pt-2">
            <Link
              href="/author/submit"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Review Author Guidelines & Submission Checklist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
