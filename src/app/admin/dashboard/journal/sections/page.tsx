import { Layers } from "lucide-react";
import { getJournalSections } from "./actions";
import { SectionsClient } from "./SectionsClient";

export default async function JournalSectionsPage() {
  const initialSections = await getJournalSections();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Layers className="w-6 h-6 mr-3 text-indigo-600" />
          Manage Sections
        </h1>
        <p className="text-slate-600 mt-2">
          Configure the different sections of your journal (e.g., Original Research, Reviews, Short Communications). 
          These sections dictate manuscript policies and peer-review requirements for authors.
        </p>
      </div>

      <SectionsClient initialSections={initialSections} />
    </div>
  );
}