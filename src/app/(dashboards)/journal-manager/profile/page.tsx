import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function JournalProfilePage() {
  const settings = await prisma.journalSetting.findMany();
  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || "";

  async function updateProfile(formData: FormData) {
    "use server";
    
    const fields = [
      "journalName", "shortName", "issn", "description", 
      "aimAndScope", "publisher", "contactEmail", "contactPhone", 
      "publicationFrequency", "journalWebsite", "journalAddress"
    ];

    for (const key of fields) {
      const value = formData.get(key) as string;
      if (value !== null) {
        await prisma.journalSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }
    revalidatePath("/journal-manager/profile");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Journal Profile</h1>
        <p className="text-slate-600">Manage the core information and public details of the journal.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form action={updateProfile} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Journal Name *</label>
              <input name="journalName" defaultValue={getSetting("journalName")} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Short Name</label>
              <input name="shortName" defaultValue={getSetting("shortName")} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">ISSN / e-ISSN</label>
              <input name="issn" defaultValue={getSetting("issn")} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Publication Frequency</label>
              <input name="publicationFrequency" defaultValue={getSetting("publicationFrequency")} placeholder="e.g. Quarterly" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Journal Description</label>
            <textarea name="description" defaultValue={getSetting("description")} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Aim and Scope</label>
            <textarea name="aimAndScope" defaultValue={getSetting("aimAndScope")} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>

          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mt-8 mb-4">Contact & Publisher</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Publisher Name</label>
              <input name="publisher" defaultValue={getSetting("publisher")} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Journal Website</label>
              <input name="journalWebsite" defaultValue={getSetting("journalWebsite")} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Contact Email</label>
              <input name="contactEmail" defaultValue={getSetting("contactEmail")} type="email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Contact Phone</label>
              <input name="contactPhone" defaultValue={getSetting("contactPhone")} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Journal Address</label>
            <textarea name="journalAddress" defaultValue={getSetting("journalAddress")} rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
