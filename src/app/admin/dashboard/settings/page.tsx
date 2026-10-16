import { getSystemSettings } from "./actions";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="max-w-4xl mx-auto">
      <SettingsClient initialSettings={settings} />
    </div>
  );
}