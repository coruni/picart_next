
import { cn, getPublicConfig } from "@/lib";

export async function SiteContactWidget() {
  let siteContact = "";

  try {
    const config = await getPublicConfig();
    siteContact =
      typeof config?.site_contact === "string" ? config.site_contact : "";
  } catch (error) {
    console.error("Failed to fetch site contact:", error);
    return null;
  }

  if (!siteContact.trim()) {
    return null;
  }

  return (
    <section
      className={cn(
        "text-sm leading-6 text-secondary",
        "[&_a:not([href^='mailto:'])]:relative",
        "[&_a:not([href^='mailto:'])]:text-primary",
        "[&_a:not([href^='mailto:'])]:inline-block",

        "[&_a:not([href^='mailto:'])]:before:content-['']",
        "[&_a:not([href^='mailto:'])]:before:absolute",
        "[&_a:not([href^='mailto:'])]:before:left-1/2",
        "[&_a:not([href^='mailto:'])]:before:bottom-0",
        "[&_a:not([href^='mailto:'])]:before:h-0.5",
        "[&_a:not([href^='mailto:'])]:before:w-0",
        "[&_a:not([href^='mailto:'])]:before:-translate-x-1/2",
        "[&_a:not([href^='mailto:'])]:before:bg-primary",
        "[&_a:not([href^='mailto:'])]:before:transition-all",
        "[&_a:not([href^='mailto:'])]:before:duration-300",
        "[&_a:not([href^='mailto:'])]:before:rounded-full",
        "[&_a:not([href^='mailto:']):hover]:before:w-full",
      )}
      data-auto-translate-content
      dangerouslySetInnerHTML={{ __html: siteContact }}
    />
  );
}
