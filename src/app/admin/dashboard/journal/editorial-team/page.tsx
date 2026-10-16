import { Users } from "lucide-react";
import { getEditorialTeam } from "./actions";
import { EditorialTeamClient } from "./EditorialTeamClient";

export default async function EditorialTeamPage() {
  const team = await getEditorialTeam();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Users className="w-6 h-6 mr-3 text-emerald-600" />
          Editorial Team
        </h1>
        <p className="text-slate-600 mt-2">
          Manage the members of your editorial board. You can assign Journal Manager, Editor, and Section Editor roles to registered users here.
        </p>
      </div>

      <EditorialTeamClient initialTeam={team} />
    </div>
  );
}