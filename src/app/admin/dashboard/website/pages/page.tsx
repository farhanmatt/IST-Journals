import { getWebsiteSettings } from "../actions";
import { PagesClient } from "./PagesClient";

export default async function PagesPage() {
  const settings = await getWebsiteSettings();

  return (
    <div className="max-w-4xl mx-auto">
      <PagesClient initialSettings={settings} />
    </div>
  );
}