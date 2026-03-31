import { SettingContactSections } from "@/components/setting/SettingContactSections";
import { getTranslations } from "next-intl/server";

export default async function SettingInfoPage() {
  const t = await getTranslations("setting.contact");

  return (
    <div className="px-3 py-2">
      <div className="text-sm leading-7 text-muted-foreground">
        {t("notice")}
      </div>

      <SettingContactSections />
    </div>
  );
}
