"use server";

import { getPublicConfig } from "@/lib";

export async function SiteContactWidget() {
  let siteContact = "";

  try {
    const config = await getPublicConfig();
    siteContact = typeof config?.site_contact === "string" ? config.site_contact : "";
  } catch (error) {
    console.error("Failed to fetch site contact:", error);
    return null;
  }

  if (!siteContact.trim()) {
    return null;
  }

  return (
    <section
      className="text-sm leading-6 text-secondary"
      dangerouslySetInnerHTML={{ __html: siteContact }}
    />
  );
}
