import prisma from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { Settings } from "lucide-react";

export default async function JournalSettingsPage() {
  // Fetch existing settings from the database
  const settingsRecords = await prisma.journalSetting.findMany();
  
  // Convert array of records to a simple key-value object
  const initialSettings = settingsRecords.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Settings className="w-6 h-6 mr-3 text-blue-600" />
          Journal Settings
        </h1>
        <p className="text-slate-600 mt-2">
          Manage the global configuration, metadata, and contact details for your journal. These settings will be reflected immediately on the public landing page.
        </p>
      </div>

      <SettingsForm initialSettings={initialSettings} />
    </div>
  );
}