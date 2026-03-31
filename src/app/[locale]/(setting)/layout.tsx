import { SettingHeader } from "@/components/setting/SettingHeader";
import { SettingMenu } from "@/components/setting/SettingMenu";
import { ReactNode } from "react";

type SettingLayoutProps = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

export default async function SettingLayout({
  params,
  children,
}: SettingLayoutProps) {
  void params;

  return (
    <div className="page-container max-w-3xl!">
      <div
        id="setting-left-panel"
        className="top-header sticky self-start rounded-xl border border-border bg-card px-1 py-3 md:min-w-56 md:px-2 md:py-4"
      >
        <SettingMenu />
      </div>
      <div id="setting-right-panel" className="min-w-0 flex-1 relative">
        <div className="h-full rounded-xl border border-border bg-card">
          <div className="top-header sticky flex h-14 items-center rounded-t-xl border-b border-border bg-card px-3">
            <SettingHeader />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
