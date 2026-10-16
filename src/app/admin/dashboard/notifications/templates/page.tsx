import { Mail } from "lucide-react";
import { getEmailTemplates } from "./actions";
import { TemplatesClient } from "./TemplatesClient";

export default async function EmailTemplatesPage() {
  const initialTemplates = await getEmailTemplates();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Mail className="w-6 h-6 mr-3 text-blue-600" />
          Email Templates
        </h1>
        <p className="text-slate-600 mt-2">
          Configure the automated email messages sent to authors, reviewers, and editorial staff during the manuscript workflow.
        </p>
      </div>

      <TemplatesClient initialTemplates={initialTemplates} />
    </div>
  );
}