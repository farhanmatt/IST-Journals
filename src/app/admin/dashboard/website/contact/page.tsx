import { getWebsiteSettings } from "../actions";
import { ContactClient } from "./ContactClient";

export default async function ContactPage() {
  const settings = await getWebsiteSettings();

  return (
    <div className="max-w-4xl mx-auto">
      <ContactClient initialSettings={settings} />
    </div>
  );
}