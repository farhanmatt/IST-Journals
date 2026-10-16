import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

export default async function SectionsPage() {
  const sections = await prisma.section.findMany({
    include: {
      editors: {
        include: { user: true }
      }
    }
  });

  const availableEditors = await prisma.userRole.findMany({
    where: { role: "SECTION_EDITOR" },
    include: { user: true }
  });

  async function createSection(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    if (name) {
      await prisma.section.create({
        data: { name, description }
      });
      revalidatePath("/journal-manager/sections");
    }
  }

  async function deleteSection(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await prisma.section.delete({ where: { id } });
      revalidatePath("/journal-manager/sections");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Journal Sections</h1>
          <p className="text-slate-600">Manage manuscript categories and assign section editors.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {sections.map(section => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  {section.name}
                  <span className={`ml-3 px-2 py-0.5 text-xs font-semibold rounded-full ${section.status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {section.status ? 'Active' : 'Inactive'}
                  </span>
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-lg">{section.description}</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Editors</p>
                  {section.editors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {section.editors.map(se => (
                        <span key={se.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {se.user.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No editors assigned</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <form action={deleteSection}>
                  <input type="hidden" name="id" value={section.id} />
                  <button type="submit" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">No sections created yet.</p>
            </div>
          )}
        </div>

        <div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-blue-600" />
              Create Section
            </h3>
            <form action={createSection} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Section Name</label>
                <input name="name" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" placeholder="e.g. Research Articles" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea name="description" rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" placeholder="Brief description of this section's scope..."></textarea>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm">
                Add Section
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
