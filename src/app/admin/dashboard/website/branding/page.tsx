import { getWebsiteSettings } from "../actions";
import { BrandingClient } from "./BrandingClient";

export default async function BrandingPage() {
  const settings = await getWebsiteSettings();

  return (
    <div className="max-w-4xl mx-auto">
      <BrandingClient initialSettings={settings} />
    </div>
  );
}