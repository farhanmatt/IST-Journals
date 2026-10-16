import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function WebsiteContentPage() {
  const defaultPages = [
    { slug: "about", title: "About the Journal" },
    { slug: "author-guidelines", title: "Author Guidelines" },
    { slug: "reviewer-guidelines", title: "Reviewer Guidelines" },
    { slug: "peer-review-policy", title: "Peer Review Policy" },
    { slug: "publication-ethics", title: "Publication Ethics" },
    { slug: "privacy-policy", title: "Privacy Policy" },
  ];

  // Ensure defaults exist
  for (const p of defaultPages) {
    const exists = await prisma.websiteContent.findUnique({ where: { slug: p.slug } });
    if (!exists) {
      await prisma.websiteContent.create({ data: { slug: p.slug, title: p.title, content: "" } });
    }
  }

  const pages = await prisma.websiteContent.findMany({ orderBy: { title: "asc" } });

  async function updatePage(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const content = formData.get("content") as string;
    const isPublished = formData.get("isPublished") === "on";

    if (id) {
      await prisma.websiteContent.update({
        where: { id },
        data: { content, isPublished }
      });
      revalidatePath("/journal-manager/website-content");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Website Content</h1>
        <p className="text-slate-600">Manage dynamic pages displayed on the public journal website.</p>
      </div>

      <div className="space-y-8">
        {pages.map(page => (
          <div key={page.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <form action={updatePage}>
              <input type="hidden" name="id" value={page.id} />
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{page.title}</h3>
                  <p className="text-xs text-slate-500 font-mono">/{page.slug}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" name="isPublished" defaultChecked={page.isPublished} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                    <span>Published</span>
                  </label>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
              <div className="p-0">
                <textarea 
                  name="content" 
                  defaultValue={page.content} 
                  rows={8} 
                  placeholder="Enter content (Markdown or HTML supported in future updates)..."
                  className="w-full px-6 py-4 border-none focus:ring-0 focus:outline-none resize-y text-slate-700 font-sans"
                ></textarea>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
